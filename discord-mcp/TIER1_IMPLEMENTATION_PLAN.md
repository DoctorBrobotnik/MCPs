# Tier 1 Discord MCP Tools - Implementation Plan

## Overview
Implement 10 high-priority Discord MCP tools that provide the most value for common use cases. These tools cover essential Discord operations including member management, server information, role management, reactions, pinning, and threading.

**Current Status**: 5 tools implemented
**After Tier 1**: 15 tools total

---

## Tools to Implement

### 1. discord_create_thread
**Purpose**: Create conversation threads to organize discussions

**Parameters**:
- `channel` (string, required): Channel ID or name
- `name` (string, required): Thread name
- `message_id` (string, optional): Message to start thread from
- `auto_archive_duration` (number, optional): Archive duration in minutes (60, 1440, 4320, 10080)
- `server` (string, optional): Server/guild ID

**Discord.js API**:
- `channel.threads.create({name, autoArchiveDuration})`
- OR `message.startThread({name, autoArchiveDuration})`

**Required Permissions**: Create Public Threads

**Return Format**:
```json
{
  "success": true,
  "thread_id": "123456789",
  "thread_name": "New Discussion",
  "parent_channel": "#general",
  "server": "My Server"
}
```

---

### 2. discord_get_member_info
**Purpose**: Get detailed information about a server member

**Parameters**:
- `user_id` (string, required): Discord user ID
- `server` (string, required): Server/guild ID or name

**Discord.js API**: `guild.members.fetch(userId)`

**Required Permissions**: View Channels, Guild Members intent

**Return Format**:
```json
{
  "user_id": "123456789",
  "username": "username",
  "discriminator": "0000",
  "nickname": "Display Name",
  "roles": ["Role1", "Role2"],
  "joined_at": "2023-01-15T10:30:00Z",
  "account_created_at": "2022-01-01T00:00:00Z",
  "avatar_url": "https://...",
  "is_bot": false,
  "server": "My Server"
}
```

---

### 3. discord_list_members
**Purpose**: List all members in a server

**Parameters**:
- `server` (string, required): Server/guild ID or name
- `limit` (number, optional): Max members to fetch, 1-1000, default 100

**Discord.js API**: `guild.members.fetch({limit})`

**Required Permissions**: View Channels, Guild Members intent

**Return Format**:
```json
{
  "server": "My Server",
  "server_id": "123456789",
  "total_members": 250,
  "returned_members": 100,
  "members": [
    {
      "user_id": "123456789",
      "username": "user1",
      "nickname": "Display",
      "roles": ["Member"],
      "joined_at": "2023-01-15T10:30:00Z"
    }
  ]
}
```

---

### 4. discord_get_server_info
**Purpose**: Get detailed server/guild information

**Parameters**:
- `server` (string, required): Server/guild ID or name

**Discord.js API**: `guild.fetch()` + guild properties

**Required Permissions**: View Channels

**Return Format**:
```json
{
  "server_id": "123456789",
  "server_name": "My Server",
  "owner_id": "123456789",
  "owner_username": "server_owner",
  "member_count": 250,
  "created_at": "2022-01-01T00:00:00Z",
  "icon_url": "https://...",
  "description": "Server description",
  "boost_tier": 2,
  "boost_count": 5,
  "features": ["COMMUNITY", "DISCOVERABLE"]
}
```

---

### 5. discord_list_roles
**Purpose**: List all roles in a server

**Parameters**:
- `server` (string, required): Server/guild ID or name

**Discord.js API**: `guild.roles.fetch()`

**Required Permissions**: View Channels

**Return Format**:
```json
{
  "server": "My Server",
  "server_id": "123456789",
  "total_roles": 10,
  "roles": [
    {
      "role_id": "123456789",
      "name": "Moderator",
      "color": "#FF0000",
      "permissions": ["MANAGE_MESSAGES", "KICK_MEMBERS"],
      "position": 5,
      "member_count": 3,
      "is_hoisted": true,
      "is_mentionable": true
    }
  ]
}
```

---

### 6. discord_assign_role
**Purpose**: Add a role to a member

**Parameters**:
- `user_id` (string, required): Discord user ID
- `role_id` (string, required): Role ID
- `server` (string, required): Server/guild ID or name
- `reason` (string, optional): Audit log reason

**Discord.js API**: `member.roles.add(roleId, reason)`

**Required Permissions**: Manage Roles

**Return Format**:
```json
{
  "success": true,
  "message": "Role 'Moderator' assigned to user 'username'",
  "user_id": "123456789",
  "username": "username",
  "role_id": "123456789",
  "role_name": "Moderator",
  "server": "My Server"
}
```

---

### 7. discord_remove_role
**Purpose**: Remove a role from a member

**Parameters**:
- `user_id` (string, required): Discord user ID
- `role_id` (string, required): Role ID
- `server` (string, required): Server/guild ID or name
- `reason` (string, optional): Audit log reason

**Discord.js API**: `member.roles.remove(roleId, reason)`

**Required Permissions**: Manage Roles

**Return Format**:
```json
{
  "success": true,
  "message": "Role 'Moderator' removed from user 'username'",
  "user_id": "123456789",
  "username": "username",
  "role_id": "123456789",
  "role_name": "Moderator",
  "server": "My Server"
}
```

---

### 8. discord_add_reaction
**Purpose**: Add emoji reaction to a message

**Parameters**:
- `message_id` (string, required): Message ID
- `emoji` (string, required): Emoji (Unicode like "👍" or custom like ":heart:1234567890")
- `channel` (string, required): Channel ID or name
- `server` (string, optional): Server/guild ID

**Discord.js API**: `message.react(emoji)`

**Required Permissions**: Add Reactions, Read Message History

**Return Format**:
```json
{
  "success": true,
  "message": "Emoji '👍' added to message in #channel",
  "message_id": "123456789",
  "emoji": "👍",
  "channel": "#general",
  "server": "My Server"
}
```

---

### 9. discord_pin_message
**Purpose**: Pin an important message in a channel

**Parameters**:
- `message_id` (string, required): Message ID to pin
- `channel` (string, required): Channel ID or name
- `server` (string, optional): Server/guild ID

**Discord.js API**: `message.pin()`

**Required Permissions**: Manage Messages

**Return Format**:
```json
{
  "success": true,
  "message": "Message pinned in #channel",
  "message_id": "123456789",
  "channel": "#general",
  "server": "My Server",
  "pinned_count": 5
}
```

---

### 10. discord_get_server_stats
**Purpose**: Get server analytics and statistics

**Parameters**:
- `server` (string, required): Server/guild ID or name

**Discord.js API**: Aggregate from guild properties

**Required Permissions**: View Channels, Guild Members intent (for accurate online count)

**Return Format**:
```json
{
  "server_id": "123456789",
  "server_name": "My Server",
  "member_count": 250,
  "online_count": 45,
  "text_channels": 15,
  "voice_channels": 3,
  "categories": 5,
  "total_channels": 23,
  "role_count": 10,
  "emoji_count": 25,
  "boost_tier": 2,
  "boost_count": 5,
  "created_at": "2022-01-01T00:00:00Z",
  "creation_timestamp": 1640995200000
}
```

---

## Implementation Steps

### Step 1: Update Validators (src/utils/validators.ts)
Add 10 new Zod schemas:

```typescript
export const CreateThreadSchema = z.object({
  channel: z.string().describe('Channel ID or name'),
  name: z.string().min(1).describe('Thread name'),
  message_id: z.string().optional().describe('Message ID to start thread from'),
  auto_archive_duration: z.number().optional().describe('Archive duration: 60, 1440, 4320, or 10080'),
  server: z.string().optional().describe('Server/guild ID')
});

export const GetMemberInfoSchema = z.object({
  user_id: z.string().describe('Discord user ID'),
  server: z.string().describe('Server/guild ID or name')
});

export const ListMembersSchema = z.object({
  server: z.string().describe('Server/guild ID or name'),
  limit: z.number().min(1).max(1000).default(100).describe('Max members to fetch (1-1000, default 100)')
});

export const GetServerInfoSchema = z.object({
  server: z.string().describe('Server/guild ID or name')
});

export const ListRolesSchema = z.object({
  server: z.string().describe('Server/guild ID or name')
});

export const AssignRoleSchema = z.object({
  user_id: z.string().describe('Discord user ID'),
  role_id: z.string().describe('Role ID'),
  server: z.string().describe('Server/guild ID or name'),
  reason: z.string().optional().describe('Audit log reason')
});

export const RemoveRoleSchema = z.object({
  user_id: z.string().describe('Discord user ID'),
  role_id: z.string().describe('Role ID'),
  server: z.string().describe('Server/guild ID or name'),
  reason: z.string().optional().describe('Audit log reason')
});

export const AddReactionSchema = z.object({
  message_id: z.string().describe('Message ID'),
  emoji: z.string().describe('Emoji (Unicode or custom)'),
  channel: z.string().describe('Channel ID or name'),
  server: z.string().optional().describe('Server/guild ID')
});

export const PinMessageSchema = z.object({
  message_id: z.string().describe('Message ID to pin'),
  channel: z.string().describe('Channel ID or name'),
  server: z.string().optional().describe('Server/guild ID')
});

export const GetServerStatsSchema = z.object({
  server: z.string().describe('Server/guild ID or name')
});
```

### Step 2: Create 10 Tool Files (src/tools/)

Create files following the existing pattern:
- `discord_create_thread.ts`
- `discord_get_member_info.ts`
- `discord_list_members.ts`
- `discord_get_server_info.ts`
- `discord_list_roles.ts`
- `discord_assign_role.ts`
- `discord_remove_role.ts`
- `discord_add_reaction.ts`
- `discord_pin_message.ts`
- `discord_get_server_stats.ts`

Each file structure:
```typescript
import { Client } from 'discord.js';
import { ToolNameSchema } from '../utils/validators.js';
import { findChannel, findGuild, findMember } from '../utils/channel-lookup.js';
import { formatSuccess, formatError } from '../utils/formatters.js';

export const toolName = {
  name: 'discord_tool_name',
  description: 'Description of what the tool does',
  schema: ToolNameSchema,

  async handler(client: Client, params: any) {
    try {
      const validatedParams = ToolNameSchema.parse(params);
      // Implementation logic here
      return formatSuccess('Result message');
    } catch (error) {
      return formatError(error);
    }
  }
};
```

### Step 3: Update Helper Utilities (src/utils/channel-lookup.ts)

Add helper functions if needed:
```typescript
/**
 * Find a Discord member by user ID
 */
export async function findMember(client: Client, userId: string, guildId: string) {
  const guild = await findGuild(client, guildId);
  return await guild.members.fetch(userId);
}

/**
 * Find a Discord role by ID or name
 */
export async function findRole(client: Client, roleIdentifier: string, guildId: string) {
  const guild = await findGuild(client, guildId);
  // Implementation for finding role
}

/**
 * Find a Discord message by ID in a channel
 */
export async function findMessage(client: Client, messageId: string, channelId: string) {
  const channel = await client.channels.fetch(channelId);
  return await channel.messages.fetch(messageId);
}
```

### Step 4: Update Index (src/index.ts)

1. Import all 10 new tools at the top
2. Add to `tools` array (will be 15 total)
3. Update `GatewayIntentBits` to include:
   ```typescript
   GatewayIntentBits.Guilds,
   GatewayIntentBits.GuildMessages,
   GatewayIntentBits.MessageContent,
   GatewayIntentBits.GuildMembers,  // ADD THIS for member operations
   ```

### Step 5: Build and Test

```bash
# Build TypeScript
npm run build

# Test with sample inputs (can use curl or MCP test tools)
# Start with read-only tools first (get_server_info, list_roles)
# Then test simple actions (add_reaction, pin_message)
# Then test complex operations (assign_role, create_thread)

# Rebuild Docker image
docker build -t discord-mcp .

# Verify no build errors
docker image ls
```

### Step 6: Update Version and Documentation

- Update `package.json` version (e.g., 1.1.0)
- Update README.md with all 10 new tools
- Update Docker image tag in catalog YAML

### Step 7: Commit and Push

```bash
git add .
git commit -m "Add Tier 1 Discord MCP tools (10 tools)

- discord_create_thread: Create conversation threads
- discord_get_member_info: Get member details
- discord_list_members: List server members
- discord_get_server_info: Get server information
- discord_list_roles: List server roles
- discord_assign_role: Assign roles to members
- discord_remove_role: Remove roles from members
- discord_add_reaction: Add emoji reactions
- discord_pin_message: Pin important messages
- discord_get_server_stats: Get server statistics"

git push
```

---

## File Changes Summary

### New Files (10)
```
src/tools/
├── discord_create_thread.ts
├── discord_get_member_info.ts
├── discord_list_members.ts
├── discord_get_server_info.ts
├── discord_list_roles.ts
├── discord_assign_role.ts
├── discord_remove_role.ts
├── discord_add_reaction.ts
├── discord_pin_message.ts
└── discord_get_server_stats.ts
```

### Modified Files (4)
- `src/utils/validators.ts` - Add 10 schemas
- `src/utils/channel-lookup.ts` - Add helper functions
- `src/index.ts` - Import tools, add to array, update intents
- `README.md` - Document new tools
- `package.json` - Update version to 1.1.0
- `Catalog YAML` - Add 10 tool entries

---

## Required Discord Bot Permissions

The Discord bot token must have these permissions:
- **Read Messages/View Channels** - Required for all read operations
- **Send Messages** - For command responses
- **Read Message History** - For fetching messages
- **Manage Messages** - For pinning/unpinning
- **Manage Roles** - For role assignment/removal
- **Add Reactions** - For emoji reactions
- **Create Public Threads** - For threading
- **Moderate Members** - For member timeouts (if adding that later)

**Recommended scopes for bot invite URL**:
```
bot
applications.commands
```

**Recommended permissions**:
```
View Channels (1024)
Read Message History (65536)
Send Messages (2048)
Manage Messages (8192)
Manage Roles (268435456)
Add Reactions (64)
Create Public Threads (34359738368)
```

---

## Testing Order and Checklist

Test in order of complexity (read-only first, then actions):

### Phase 1: Read-Only Tests
- [ ] discord_get_server_info
- [ ] discord_list_roles
- [ ] discord_get_member_info
- [ ] discord_list_members
- [ ] discord_get_server_stats

### Phase 2: Simple Action Tests
- [ ] discord_add_reaction (with valid emoji)
- [ ] discord_pin_message (on existing message)

### Phase 3: Complex Operation Tests
- [ ] discord_create_thread
- [ ] discord_assign_role
- [ ] discord_remove_role

---

## Estimated Time Breakdown

- **Validators**: 30 minutes
- **Tool implementations**: 3-4 hours (can parallelize)
- **Helper utilities**: 30 minutes
- **Index updates**: 15 minutes
- **Testing**: 1 hour
- **Documentation**: 30 minutes
- **Build & verification**: 15 minutes
- **Git commit & push**: 5 minutes

**Total: ~6 hours**

---

## Next Steps

After Tier 1 is complete and tested:
1. Reference `FUTURE_TOOLS.md` for Tier 2-4 recommendations
2. Implement Tier 2 (Moderation & Management - 8 tools)
3. Implement Tier 3 (Advanced Features - 7 tools)
4. Implement Tier 4 (Specialized Use Cases - 5 tools)

Total future tools: 20
Total final tools: 30 (15 base + 5 current + 10 Tier 1)
