# MCP Servers Collection

A curated collection of custom Model Context Protocol (MCP) servers that extend Claude's capabilities with powerful integrations for Discord, music generation, and more.

## What are MCP Servers?

Model Context Protocol (MCP) servers are containerized tools that extend Claude's functionality by providing access to external services, APIs, and custom operations. Think of them as plugins that give Claude new abilities - like sending Discord messages, generating AI music, or interacting with other platforms.

MCP servers run in Docker containers and communicate with Claude through the MCP Gateway, making them secure, isolated, and easy to manage.

## How This Repository Works

This is a **public repository** with **automated CI/CD builds**:

- **Developers** commit code to GitHub
- **GitHub Actions** automatically builds Docker images
- **Images are published** to GitHub Container Registry (GHCR)
- **Images are automatically set to public visibility** - no authentication required
- **Users pull** pre-built images directly (no local builds, no GitHub login needed)

**Key Benefit:** All images are automatically made public after successful builds, so users can immediately pull and use them without any GitHub authentication.

## Available Servers

### Discord MCP Server

Control Discord directly from Claude - send messages, read conversations, search channels, and manage servers.

**Capabilities:**
- Send messages to any Discord channel
- Read message history from channels (up to 100 messages)
- Search messages by content (case-insensitive)
- List all accessible channels (filtered by server)
- List all Discord servers the bot can access

**Use Cases:**
- Automated Discord notifications and announcements
- Message monitoring and content moderation
- Community engagement and bot interactions
- Channel management and server administration
- Message history analysis and archival

**Tools Provided:**
- `discord_send_message` - Post messages to channels
- `discord_read_messages` - Retrieve conversation history
- `discord_search_messages` - Find messages containing specific text
- `discord_list_channels` - View all accessible channels
- `discord_list_servers` - See all servers the bot belongs to

[View Discord MCP Documentation](discord-mcp/README.md)

---

### Suno MCP Server

Generate AI-powered music, manipulate audio, and create music videos using Suno AI's advanced music generation platform.

**Capabilities:**
- Generate original music from text descriptions
- Customize music with 14+ parameters (style, mood, vocals, etc.)
- Separate vocals and instrumentals (2 or 12 stems)
- Extend existing tracks with new content
- Convert audio to professional WAV format
- Generate song lyrics from themes
- Create music videos with custom branding
- Add vocals to instrumental tracks
- Add backing music to vocal recordings

**Use Cases:**
- Content creation for videos, podcasts, and streams
- Background music for presentations and projects
- Musical experimentation and prototyping
- Audio processing and stem separation
- Music video production
- Lyric writing assistance

**Tools Provided:**
- `suno_generate_music` - Create AI music with extensive customization
- `suno_get_generation_status` - Check progress of generation tasks
- `suno_check_credits` - View remaining API credits
- `suno_separate_vocals` - Extract vocals or split into stems
- `suno_extend_music` - Extend tracks with additional content
- `suno_convert_to_wav` - Convert to professional WAV format
- `suno_generate_lyrics` - Generate song lyrics from descriptions
- `suno_create_music_video` - Create music videos with branding
- `suno_add_vocals` - Add vocals to instrumental tracks
- `suno_add_instrumental` - Add backing music to vocals

[View Suno MCP Documentation](suno-mcp/README.md)

---

## Prerequisites

Before installing any MCP servers, ensure you have:

### Required Software

1. **Docker Desktop with MCP Gateway Support**
   - Docker Desktop 4.34 or later (includes MCP Gateway)
   - Download: [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
   - Windows users: Ensure WSL 2 backend is enabled

2. **Claude Desktop or Claude Code**
   - MCP servers integrate with Claude through the MCP protocol
   - Download Claude Desktop: [https://claude.ai/download](https://claude.ai/download)

3. **Git (Optional - for cloning this repository)**
   - Download: [https://git-scm.com/downloads](https://git-scm.com/downloads)

### API Keys and Credentials

Each MCP server requires its own credentials:

- **Discord MCP**: Discord bot token from [Discord Developer Portal](https://discord.com/developers/applications)
- **Suno MCP**: Suno API key from [https://sunoapi.org/api-key](https://sunoapi.org/api-key)

See individual server documentation for detailed credential setup instructions.

---

## Quick Start

Follow these steps to enable MCP servers in Claude:

### Step 1: Verify Docker Desktop is Running

```bash
# Check Docker version
docker --version

# Expected output: Docker version 4.34.0 or later
```

**Note:** No GitHub authentication is required to pull images - all images are automatically public.

### Step 2: Clone or Download This Repository

**Option A: Clone with Git**
```bash
git clone https://github.com/DoctorBrobotnik/MCPs.git
cd MCPs
```

**Option B: Download ZIP**
1. Download from [https://github.com/DoctorBrobotnik/MCPs](https://github.com/DoctorBrobotnik/MCPs)
2. Extract to `C:\Users\YourUsername\Repos\Personal\MCPs` (Windows) or `~/Repos/Personal/MCPs` (Mac/Linux)

### Step 3: Choose a Server to Install

Each server has its own installation guide. Start with one:

- **Discord**: [discord-mcp/README.md](discord-mcp/README.md)
- **Suno**: [suno-mcp/README.md](suno-mcp/README.md)

### Step 4: General Installation Pattern

All MCP servers follow this pattern:

1. **Pull the pre-built Docker image**
   ```bash
   # Pull from GitHub Container Registry (GHCR) - no authentication required
   docker pull ghcr.io/doctorbrobotnik/<server-name>-mcp:latest
   ```

   **Note:** Images are automatically public - no GitHub login or credentials needed.

2. **Set required secrets**
   ```bash
   # Store API key or token securely
   docker mcp secret set SECRET_NAME="your-secret-value"

   # Verify secret was created
   docker mcp secret ls
   ```

3. **Register in custom catalog**
   - Edit `~/.docker/mcp/catalogs/my-custom-catalog.yaml`
   - Add server entry with image: `ghcr.io/doctorbrobotnik/<server-name>-mcp:latest`
   - See server-specific guide for catalog format

4. **Enable the server**
   ```bash
   # Enable the MCP server for use in Claude
   docker mcp server enable <server-name>-mcp

   # Verify it's enabled
   docker mcp server ls
   ```

5. **Restart Claude**
   - Close and reopen Claude Desktop
   - Tools from the enabled server will now appear

---

## Installation Guides

### Discord MCP Server Setup

1. **Create Discord Bot**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application
   - Navigate to Bot section and copy the bot token
   - Enable "Message Content Intent" under Privileged Gateway Intents

2. **Pull Pre-Built Docker Image**
   ```bash
   docker pull ghcr.io/doctorbrobotnik/discord-mcp:latest
   ```

3. **Set Discord Token**
   ```bash
   docker mcp secret set DISCORD_TOKEN="your-bot-token-here"
   ```

4. **Register in Catalog**
   - Edit `~/.docker/mcp/catalogs/my-custom-catalog.yaml`
   - Add Discord server entry with image: `ghcr.io/doctorbrobotnik/discord-mcp:latest`

5. **Enable the Server**
   ```bash
   docker mcp server enable discord-mcp
   ```

6. **Restart Claude**

**Full details:** [discord-mcp/README.md](discord-mcp/README.md)

---

### Suno MCP Server Setup

1. **Obtain Suno API Key**
   - Visit [https://sunoapi.org/api-key](https://sunoapi.org/api-key)
   - Create account and generate API key
   - Key format: `sk_xxxxxxxxxxxxx`

2. **Pull Pre-Built Docker Image**
   ```bash
   docker pull ghcr.io/doctorbrobotnik/suno-mcp:latest
   ```

3. **Set API Key**
   ```bash
   docker mcp secret set SUNO_API_KEY="sk_your_api_key_here"
   ```

4. **Register in Catalog**
   - Edit `~/.docker/mcp/catalogs/my-custom-catalog.yaml`
   - Add Suno server entry with image: `ghcr.io/doctorbrobotnik/suno-mcp:latest`

5. **Enable the Server**
   ```bash
   docker mcp server enable suno-mcp
   ```

6. **Restart Claude**

**Full details:** [suno-mcp/README.md](suno-mcp/README.md)

---

## Using MCP Tools in Claude

Once servers are installed and enabled, their tools become available in Claude conversations.

### Discovering Available Tools

After restarting Claude, ask:
```
What MCP tools do I have available?
```

Claude will list all enabled tools from your MCP servers.

### Example Usage

**Discord Examples:**
```
Send "Meeting in 10 minutes!" to the #general channel

Read the last 50 messages from #announcements

Search for messages containing "budget" in #finance
```

**Suno Examples:**
```
Generate an upbeat electronic dance track with energetic beats

Create a cinematic orchestral piece for a movie trailer

Generate lyrics about chasing dreams and never giving up
```

### Tool Discovery

Claude can intelligently use MCP tools when you:
- Ask questions related to the tool's domain (Discord, music generation, etc.)
- Request actions the tool can perform
- Mention specific capabilities (sending messages, generating audio, etc.)

You don't need to reference tools by their exact names - Claude will match your intent to the appropriate tool.

---

## Managing MCP Servers

### List Enabled Servers

```bash
docker mcp server ls
```

### Enable/Disable Servers

```bash
# Enable a server
docker mcp server enable <server-name>-mcp

# Disable a server (tools won't appear in Claude)
docker mcp server disable <server-name>-mcp
```

### View Secrets

```bash
# List all secrets (values are hidden)
docker mcp secret ls

# Set a new secret
docker mcp secret set SECRET_NAME="value"

# Update an existing secret
docker mcp secret set SECRET_NAME="new-value"
```

### View Server Logs

```bash
# View logs for a specific server
docker mcp server logs <server-name>-mcp

# Follow logs in real-time
docker mcp server logs -f <server-name>-mcp
```

### Update to Latest Version

```bash
# Pull the latest image from GHCR
docker pull ghcr.io/doctorbrobotnik/<server-name>-mcp:latest

# Restart the server
docker mcp server restart <server-name>-mcp

# Restart Claude to use the updated version
```

**Note:** The images are automatically built and published when code is pushed to the repository, so new versions are available immediately after updates.

---

## Troubleshooting

### Tools Not Appearing in Claude

**Symptoms:** MCP tools don't show up after installation

**Solutions:**
1. Verify the image was pulled successfully:
   ```bash
   docker images | grep ghcr.io/doctorbrobotnik/<server-name>-mcp
   ```

2. Check server is enabled:
   ```bash
   docker mcp server ls
   ```
   Server should show `enabled` status

3. Verify catalog entry has correct image URL:
   ```bash
   cat ~/.docker/mcp/catalogs/my-custom-catalog.yaml
   ```
   Should show: `image: ghcr.io/doctorbrobotnik/<server-name>-mcp:latest`

4. Verify secrets are set (if required):
   ```bash
   docker mcp secret ls
   ```

5. **Restart Claude** (required after any changes)

6. Check catalog configuration exists:
   - Windows: `%USERPROFILE%\.docker\mcp\catalogs\my-custom-catalog.yaml`
   - Mac/Linux: `~/.docker/mcp/catalogs/my-custom-catalog.yaml`

---

### "Secret Not Found" Errors

**Symptoms:** Error messages about missing API keys or tokens

**Solution:**
```bash
# List existing secrets
docker mcp secret ls

# Set the missing secret
docker mcp secret set SECRET_NAME="your-value-here"

# Restart the server
docker mcp server restart <server-name>-mcp
```

---

### Image Pull Failures

**Symptoms:** Error when running `docker pull ghcr.io/doctorbrobotnik/<server-name>-mcp:latest`

**Solutions:**

1. **Check Docker is running:**
   ```bash
   docker --version
   ```

2. **Verify internet connection:**
   - GitHub Container Registry requires internet access
   - Check your network connection

3. **Check if image exists:**
   - Images are automatically built when code is pushed to GitHub
   - Check [GitHub Actions tab](https://github.com/DoctorBrobotnik/MCPs/actions) for build status
   - Wait for build to complete before pulling

4. **Try pulling again with verbose output:**
   ```bash
   docker pull --verbose ghcr.io/doctorbrobotnik/<server-name>-mcp:latest
   ```

5. **Authentication Issues:**
   - **All images are automatically public** - no authentication should be required
   - If you see "401 Unauthorized", the image may not have been built yet
   - Check GitHub Actions workflow has completed successfully
   - Images become public immediately after successful build

---

### Server-Specific Issues

**Discord MCP:**
- Bot not responding? Check Message Content Intent is enabled in Developer Portal
- Permission errors? Verify bot has required channel permissions
- Channel not found? Use exact channel name or channel ID

**Suno MCP:**
- Insufficient credits? Check balance with `suno_check_credits` tool
- Polling timeouts? Task may still be processing - check status manually
- Invalid parameters? Review character limits and validation rules

**See individual server README files for detailed troubleshooting.**

---

## Security and Privacy

### API Key Management

- **Never commit secrets to git** - API keys and tokens are stored in Docker secrets only
- **Use Docker secrets** - Secure storage managed by Docker Desktop
- **Rotate credentials periodically** - Update secrets regularly for security
- **Separate environments** - Use different credentials for development and production

### Container Isolation

- All MCP servers run as **non-root users** inside containers
- Containers have **no access to host filesystem** beyond their own files
- Network access is **limited to required APIs only**
- Containers **exit when not in use** (stateless architecture)

### Data Handling

- **Discord MCP**: Bot can only access channels it's invited to
- **Suno MCP**: Audio files are hosted by Suno API (see their privacy policy)
- **No persistent storage**: MCP servers don't store data between requests

### Best Practices

1. Review server documentation before installation
2. Understand what permissions/scopes each server requires
3. Only enable servers you actively use
4. Monitor server logs for unexpected behavior
5. Keep Docker Desktop and MCP servers updated

---

## CI/CD Automation and Public Images

### Automated Build Pipeline

This repository uses **GitHub Actions** to automatically build and publish Docker images:

**What Happens When Code is Pushed:**
1. GitHub Actions detects changes to MCP server directories
2. Builds Docker images for each modified server
3. Pushes images to GitHub Container Registry (GHCR)
4. **Automatically sets images to public visibility**
5. Images are immediately available for pull

**Key Workflow Step - Public Visibility:**
```yaml
- name: Make package public
  run: |
    gh api --method PATCH /user/packages/container/${{ matrix.image-name }}/access -f visibility=public
```

This automation step ensures that:
- All images are **immediately accessible** after successful builds
- Users **do NOT need GitHub authentication** to pull images
- **No manual visibility changes** are required by maintainers
- The user experience is **simplified** - just `docker pull` and go

**Benefits for Users:**
- No GitHub account required
- No personal access tokens needed
- No docker login command necessary
- Images available within minutes of code push
- Consistent, automated deployment process

### Viewing Build Status

Check the status of automated builds:
- [GitHub Actions tab](https://github.com/DoctorBrobotnik/MCPs/actions) - shows all workflow runs
- Green checkmark = build successful, image is public and available
- Failed workflows are automatically logged for debugging

---

## Architecture Overview

### How MCP Servers Work

```
┌─────────────────┐
│  Claude Desktop │
│   (MCP Client)  │
└────────┬────────┘
         │
         │ MCP Protocol (JSON-RPC)
         │
┌────────▼───────────────────┐
│   Docker Desktop           │
│   MCP Gateway              │
│                            │
│  ┌──────────────────────┐ │
│  │  discord-mcp         │ │
│  │  (Container)         │ │
│  └──────────────────────┘ │
│                            │
│  ┌──────────────────────┐ │
│  │  suno-mcp            │ │
│  │  (Container)         │ │
│  └──────────────────────┘ │
│                            │
└────────────────────────────┘
         │
         │ HTTPS
         │
┌────────▼────────┐
│  External APIs  │
│  (Discord, Suno)│
└─────────────────┘
```

### Key Concepts

**Stateless Architecture:**
- Containers start on-demand when tools are called
- No persistent connections (containers exit when idle)
- Each request is independent and isolated

**Docker MCP Gateway:**
- Manages container lifecycle (start/stop)
- Routes tool calls to appropriate servers
- Handles secret injection securely
- Provides logging and monitoring

**Tool Registration:**
- Each server registers its tools with the gateway
- Tools appear automatically in Claude after restart
- Tool schemas define parameters and validation rules

---

## Repository Structure

```
MCPs/
├── README.md                          # This file
├── discord-mcp/                       # Discord integration server
│   ├── src/                           # TypeScript source code
│   │   ├── index.ts                   # Main server
│   │   ├── tools/                     # Tool implementations
│   │   └── utils/                     # Shared utilities
│   ├── Dockerfile                     # Container build instructions
│   ├── package.json                   # Node.js dependencies
│   ├── tsconfig.json                  # TypeScript configuration
│   └── README.md                      # Discord MCP documentation
├── suno-mcp/                          # Suno AI music generation server
│   ├── src/                           # TypeScript source code
│   │   ├── index.ts                   # Main server
│   │   ├── tools/                     # Tool implementations
│   │   ├── utils/                     # API client and async handlers
│   │   ├── config/                    # Constants and configuration
│   │   ├── types/                     # TypeScript type definitions
│   │   └── helpers/                   # Validation helpers
│   ├── Dockerfile                     # Container build instructions
│   ├── package.json                   # Node.js dependencies
│   ├── tsconfig.json                  # TypeScript configuration
│   └── README.md                      # Suno MCP documentation
└── MCP_Builder_Instruction_Template.md # Developer guide for building MCP servers
```

---

## Contributing

### Adding New MCP Servers

Want to contribute a new MCP server? Great! This repository welcomes community contributions.

**Requirements:**
1. Server must follow MCP protocol specification
2. Must run in Docker container (no local processes)
3. Use stateless architecture (no persistent connections)
4. Include comprehensive README with setup instructions
5. Follow security best practices (no hardcoded secrets)
6. Include proper error handling and user-friendly messages

**Development Guide:**
See [MCP_Builder_Instruction_Template.md](MCP_Builder_Instruction_Template.md) for detailed instructions on building new MCP servers.

### Submitting Pull Requests

1. Fork this repository
2. Create a feature branch: `git checkout -b feature/your-server-name-mcp`
3. Implement your MCP server following the template
4. Add comprehensive documentation (README.md)
5. Test locally with `npm run build && npm start` (TypeScript) or `python [server]_server.py` (Python)
6. Commit and push to your branch
7. Submit pull request with description of functionality
8. GitHub Actions will automatically build your image (no manual Docker build needed)
9. Once merged, images are automatically published to GHCR

### Reporting Issues

Found a bug or have a suggestion?

1. Check existing issues: [https://github.com/DoctorBrobotnik/MCPs/issues](https://github.com/DoctorBrobotnik/MCPs/issues)
2. Create a new issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Docker version, Claude version)
   - Relevant logs or error messages

---

## Frequently Asked Questions

### Do I need to install all MCP servers?

No! Install only the servers you need. Each server is independent and can be enabled/disabled separately.

### Can I use multiple servers at the same time?

Yes! Claude can use tools from all enabled servers in the same conversation.

### How much do MCP servers cost?

The servers themselves are free and open source. However:
- **Discord**: Free (requires Discord bot, which is free)
- **Suno**: Requires paid Suno API credits (check [https://sunoapi.org](https://sunoapi.org) for pricing)

### Are my API keys secure?

Yes. API keys are stored in Docker secrets, which are encrypted and never exposed to containers directly. They're injected at runtime and never logged or stored in plain text.

### Can I modify the servers?

Yes! All servers are open source. You can modify the code, rebuild the Docker images, and use your custom versions.

### Do servers work offline?

No. MCP servers require internet access to communicate with their respective APIs (Discord, Suno, etc.).

### What happens if a server crashes?

Docker will automatically restart the container. Each tool call is independent, so one failure doesn't affect other requests.

### Can I run servers on a different machine?

Currently, MCP servers run locally on the same machine as Claude Desktop. Remote server support may be added in future MCP updates.

### How do I update to the latest version?

```bash
# Pull the latest image from GHCR (no authentication required)
docker pull ghcr.io/doctorbrobotnik/<server-name>-mcp:latest

# Restart the server
docker mcp server restart <server-name>-mcp

# Restart Claude
```

The images are automatically built and published when code is pushed to the repository, so you always get the latest version when you pull. All images are public - no GitHub login required.

### Do I need a GitHub account to use these MCP servers?

No! All Docker images are automatically set to public visibility after being built. You can pull and use them without any GitHub account, authentication, or personal access tokens.

---

## Official Resources

### MCP Protocol

- **Official Documentation**: [https://modelcontextprotocol.io](https://modelcontextprotocol.io)
- **MCP SDK Documentation**: [https://modelcontextprotocol.io/docs/sdk](https://modelcontextprotocol.io/docs/sdk)
- **GitHub Repository**: [https://github.com/modelcontextprotocol](https://github.com/modelcontextprotocol)

### Docker

- **Docker Desktop**: [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
- **Docker Documentation**: [https://docs.docker.com](https://docs.docker.com)

### Service-Specific

- **Discord Developer Portal**: [https://discord.com/developers](https://discord.com/developers)
- **Discord.js Documentation**: [https://discord.js.org](https://discord.js.org)
- **Suno API Documentation**: [https://sunoapi.org/docs](https://sunoapi.org/docs)
- **Suno API Key Management**: [https://sunoapi.org/api-key](https://sunoapi.org/api-key)

---

## License

This project is licensed under the MIT License. See individual server directories for specific licensing information.

---

## Support

### Getting Help

1. **Check server-specific README files** for detailed documentation
2. **Review troubleshooting section** above for common issues
3. **Search existing issues** on GitHub
4. **Create a new issue** with detailed information

### Contact

- **GitHub Issues**: [https://github.com/DoctorBrobotnik/MCPs/issues](https://github.com/DoctorBrobotnik/MCPs/issues)
- **Repository**: [https://github.com/DoctorBrobotnik/MCPs](https://github.com/DoctorBrobotnik/MCPs)

---

## Acknowledgments

Built with:
- [Model Context Protocol](https://modelcontextprotocol.io) - Protocol for extending Claude
- [Docker](https://www.docker.com) - Container platform
- [TypeScript](https://www.typescriptlang.org) - Type-safe JavaScript
- [Discord.js](https://discord.js.org) - Discord API library
- [Suno API](https://sunoapi.org) - AI music generation

---

**Ready to extend Claude's capabilities? Choose a server above and get started!**
