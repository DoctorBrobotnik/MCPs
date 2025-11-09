# Discord MCP Server

A Model Context Protocol (MCP) server that enables Claude to interact with Discord - send messages, read message history, search conversations, and manage channels/servers.

## Features

### Core Tools
- **discord_send_message** - Send messages to Discord channels
- **discord_read_messages** - Retrieve message history from channels
- **discord_search_messages** - Search for messages containing specific text
- **discord_list_channels** - List all accessible channels (optionally filtered by server)
- **discord_list_servers** - List all Discord servers the bot can access

### Key Capabilities
- 🔄 **Stateless architecture** - Connects to Discord on-demand, containers spin up/down per request
- 🔍 Two-phase channel lookup (ID or name-based)
- 🏢 Multi-server support with disambiguation
- 📊 JSON-formatted message data with clean JSON schemas
- ⚡ Fast async operations
- 🛡️ Comprehensive error handling
- 🧩 Modular, extensible architecture

## Prerequisites

### 1. Create Discord Bot
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Navigate to "Bot" section in the left sidebar
4. Click "Reset Token" to generate a bot token (save this securely)
5. Enable the following Privileged Gateway Intents:
   - ✅ **Message Content Intent** (required)
   - ✅ **Server Members Intent** (optional, for member info)

### 2. Configure Bot Permissions
1. Go to OAuth2 → URL Generator
2. Select scopes: `bot`
3. Select permissions:
   - ✅ Read Messages/View Channels
   - ✅ Send Messages
   - ✅ Read Message History
4. Use the generated URL to invite the bot to your servers

**Permission Integer:** `68608`

## Installation

### Step 1: Build the Docker Image

**Windows PowerShell:**

```powershell
# Navigate to the project directory
cd $env:USERPROFILE/Repos/Personal/MCPs/discord-mcp

# Build the image (use forward slashes on Windows)
docker build -t discord-mcp .
```

Or with full path:

```powershell
docker build -t discord-mcp $env:USERPROFILE/Repos/Personal/MCPs/discord-mcp
```

**Bash/WSL/Git Bash:**

```bash
# Navigate to the project directory
cd ~/Repos/Personal/MCPs/discord-mcp

# Build the image
docker build -t discord-mcp .
```

Or with full path:

```bash
docker build -t discord-mcp ~/Repos/Personal/MCPs/discord-mcp
```

### Step 2: Set Discord Token Secret

Store your Discord bot token securely using Docker secrets:

```bash
docker mcp secret set DISCORD_TOKEN="your-bot-token-here"
```

**Where to get your token:**
1. Discord Developer Portal → Your Application
2. Bot section → Click "Reset Token"
3. Copy the token (you won't be able to see it again)

**Verify the secret was created:**

```bash
docker mcp secret ls
```

Note: These commands work the same on Windows PowerShell, Bash, WSL, and Git Bash.

### Step 3: Catalog Configuration

The discord-mcp server entry has been automatically added to your custom catalog at:
`$env:USERPROFILE/Repos/Personal/MCP_Catalogs/catalogs/my-custom-catalog.yaml`

**Important:** Verify the catalog entry uses the correct `secrets` format:

```yaml
discord-mcp:
  description: Discord integration - send and read messages, list channels and servers, search conversations
  title: Discord MCP Server
  type: server
  dateAdded: "2025-01-15T00:00:00Z"
  image: discord-mcp
  source: local
  tools:
    - name: discord_send_message
    - name: discord_read_messages
    - name: discord_list_channels
    - name: discord_list_servers
    - name: discord_search_messages
  secrets:
    - name: DISCORD_TOKEN
      env: DISCORD_TOKEN
      example: "MTk4NjIyNDgzNTUxNzY4MzI4.ClPSZQ.xxxxx"
  prompts: 0
```

**Note:** The `secrets` section with `env: DISCORD_TOKEN` is required for the token to be passed correctly to the container.

### Step 4: Restart Claude

Restart Claude and the Discord tools will be available.

## Usage Examples

### Send a Message

```
Send "Hello from Claude!" to the #general channel
```

### Read Recent Messages

```
Read the last 20 messages from #announcements
```

### Search Messages

```
Search for messages containing "meeting" in #team-chat
```

### List Channels

```
List all channels in the server
```

### List Servers

```
Show me all Discord servers the bot has access to
```

## Tool Reference

### discord_send_message

Send a message to a Discord channel.

**Parameters:**
- `channel` (required) - Channel ID or name (e.g., "general" or "123456789")
- `message` (required) - Message content to send
- `server` (optional) - Server/guild ID to disambiguate channel names

**Example:**
```json
{
  "channel": "general",
  "message": "Hello from Claude!",
  "server": "987654321"
}
```

### discord_read_messages

Retrieve message history from a channel.

**Parameters:**
- `channel` (required) - Channel ID or name
- `limit` (optional) - Number of messages (1-100, default 50)
- `server` (optional) - Server/guild ID

**Returns:** JSON array of messages with author, content, timestamp, channel, and server.

### discord_search_messages

Search for messages containing specific text.

**Parameters:**
- `channel` (required) - Channel ID or name
- `query` (required) - Search text (case-insensitive)
- `limit` (optional) - Max messages to search (1-100, default 50)
- `server` (optional) - Server/guild ID

### discord_list_channels

List all accessible channels.

**Parameters:**
- `server` (optional) - Server ID to filter by (lists all if omitted)

**Returns:** JSON array grouped by server with channel names and IDs.

### discord_list_servers

List all Discord servers the bot can access.

**Returns:** JSON array with server name, ID, member count, and channel count.

## Architecture

### Stateless Design

The Discord MCP server uses a **stateless, on-demand connection architecture**:

**How it works:**
1. **Container starts** → MCP server initializes immediately (no Discord connection)
2. **Tool called** → Creates Discord client, logs in, waits for ready event
3. **Tool executes** → Performs the requested operation
4. **Cleanup** → Destroys Discord connection, container exits when stdin closes

**Benefits:**
- ⚡ Fast startup - No waiting for Discord connection
- 💰 Resource efficient - Containers only run during tool execution
- 🔒 Secure - Connections are ephemeral, no persistent sessions
- 🐛 Easier debugging - Each request is independent

**Technical implementation:**
```typescript
// On-demand client creation
async function createDiscordClient(): Promise<Client> {
  const client = new Client({ intents: [...] });
  await client.login(DISCORD_TOKEN);
  await new Promise<void>((resolve) => {
    client.once('ready', () => resolve());
  });
  return client;
}

// Tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  let client: Client | null = null;
  try {
    client = await createDiscordClient();  // Connect
    const result = await tool.handler(client, params);  // Execute
    return result;
  } finally {
    if (client) await client.destroy();  // Disconnect
  }
});
```

### Modular Design

The server is organized for easy extension:

```
discord-mcp/
├── src/
│   ├── index.ts              # Main server & Discord client
│   ├── tools/                # Individual tool modules
│   │   ├── discord_send_message.ts
│   │   ├── discord_read_messages.ts
│   │   ├── discord_list_channels.ts
│   │   ├── discord_list_servers.ts
│   │   └── discord_search_messages.ts
│   └── utils/                # Shared utilities
│       ├── channel-lookup.ts # Channel resolution
│       ├── formatters.ts     # Output formatting
│       └── validators.ts     # Zod schemas
```

### Adding New Tools

To add a new tool:

1. **Create tool file** in `src/tools/your-tool.ts`:

```typescript
import { Client } from 'discord.js';
import { z } from 'zod';

export const yourTool = {
  name: 'your-tool',
  description: 'What your tool does',
  schema: z.object({
    param: z.string().describe('Parameter description')
  }),

  async handler(client: Client, params: any) {
    try {
      const { param } = this.schema.parse(params);
      // Your implementation
      return '✅ Success!';
    } catch (error) {
      return `❌ Error: ${error}`;
    }
  }
};
```

2. **Import in index.ts**:

```typescript
import { yourTool } from './tools/your-tool.js';
```

3. **Add to tools array**:

```typescript
const tools = [
  sendMessage,
  readMessages,
  listChannels,
  listServers,
  searchMessages,
  yourTool  // Add here
];
```

4. **Rebuild**:

**Windows PowerShell:**

```powershell
docker build -t discord-mcp $env:USERPROFILE/Repos/Personal/MCPs/discord-mcp
```

**Bash/WSL/Git Bash:**

```bash
docker build -t discord-mcp ~/Repos/Personal/MCPs/discord-mcp
```

## Troubleshooting

### Bot Not Responding

1. **Check token is set:**
   ```bash
   docker mcp secret ls
   ```

2. **Verify bot is online:**
   - Check Discord server - bot should appear online
   - Look for "✅ Discord bot ready" in logs

3. **Check Privileged Intents:**
   - Message Content Intent must be enabled in Developer Portal

### "Channel not found" Errors

- Use exact channel name (case-insensitive, # is optional)
- Or use channel ID for precision
- Provide server ID if channel name exists in multiple servers

### "Permission denied" Errors

- Verify bot has required permissions in the channel
- Check role hierarchy (bot role must be high enough)
- Ensure Read Messages, Send Messages permissions are granted

### Tools Not Appearing in Claude

1. Restart Claude
2. Check catalog entry exists in `$env:USERPROFILE/Repos/Personal/MCP_Catalogs/catalogs/my-custom-catalog.yaml`
3. Verify Docker image built successfully: `docker images discord-mcp`
4. **Verify catalog uses `secrets` format (not `env`):**
   ```yaml
   secrets:
     - name: DISCORD_TOKEN
       env: DISCORD_TOKEN
       example: "MTk4NjIyNDgzNTUxNzY4MzI4.ClPSZQ.xxxxx"
   ```
   The `env: DISCORD_TOKEN` mapping is required for the secret to be passed correctly.

### Raw Zod Objects in Tool Schemas

If tool schemas show raw Zod objects instead of clean JSON:

**Symptom:**
```json
{"_def": {"typeName": "ZodString", ...}}
```

**Solution:**
The server now manually converts Zod schemas to JSON Schema. Rebuild if you see this:

**Windows PowerShell:**

```powershell
docker build -t discord-mcp $env:USERPROFILE/Repos/Personal/MCPs/discord-mcp
```

**Bash/WSL/Git Bash:**

```bash
docker build -t discord-mcp ~/Repos/Personal/MCPs/discord-mcp
```

## Technical Details

### Discord Client Configuration

**Intents:**
- `Guilds` - Access to guild/server events
- `GuildMessages` - Message events
- `MessageContent` - Access to message content (privileged)

**Required Bot Permissions:**
- Read Messages/View Channels (`1024`)
- Send Messages (`2048`)
- Read Message History (`65536`)
- **Combined:** `68608`

### Channel Lookup Logic

Two-phase resolution strategy:

1. **ID-based lookup** - If identifier is numeric, fetch by ID
2. **Name-based search** - Search by name (case-insensitive, strips #)
3. **Guild filtering** - If server ID provided, verify channel belongs to that guild
4. **Disambiguation** - List options if multiple matches found

### Message Format

Messages are returned as JSON with the following structure:

```json
{
  "author": "Username#1234",
  "content": "Message text",
  "timestamp": "2025-01-07T12:34:56.789Z",
  "channel": "#channel-name",
  "server": "Server Name",
  "messageId": "123456789"
}
```

## Security Notes

- Bot token is stored as a Docker secret (never in code)
- Bot runs as non-root user in container
- No DM support (server channels only)
- Message Content Intent is required (privileged)

## Development

### Local Testing

**Windows PowerShell:**

```powershell
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build TypeScript
npm run build

# Start production build
npm start
```

**Bash/WSL/Git Bash:**

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build TypeScript
npm run build

# Start production build
npm start
```

### Watch Mode

**Windows PowerShell:**

```powershell
npm run watch
```

**Bash/WSL/Git Bash:**

```bash
npm run watch
```

## License

MIT

## Support

For issues or questions about the MCP server, check:
- [MCP Documentation](https://modelcontextprotocol.io)
- [Discord.js Documentation](https://discord.js.org)
- [Discord Developer Portal](https://discord.com/developers)
