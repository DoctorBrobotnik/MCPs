# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This repository contains **MCP_Builder_Instruction_Template.md**, a comprehensive guide for building Model Context Protocol (MCP) servers. MCP servers are tools that extend Claude's capabilities by exposing custom tools and resources through the Model Context Protocol.

## Official MCP Documentation

**ALWAYS reference the official MCP SDK documentation** when building MCP servers:
- **MCP SDK Documentation**: https://modelcontextprotocol.io/docs/sdk (covers all implementations including Python, TypeScript, etc.)
- **FastMCP Documentation**: https://gofastmcp.com (Python-specific framework for rapid development)

The MCP SDK documentation is the authoritative source for:
- Tool parameter handling (no parameter wrapping/unwrapping needed)
- Supported parameter types and type hints
- Best practices for tool definitions
- Context API usage and capabilities
- Return value formatting
- Protocol compliance and standards across all languages

## Default Language for New MCP Servers

**TypeScript is the preferred language** for new MCP server implementations unless the user's build prompt explicitly requests a different language (Python, Go, etc.). TypeScript provides better type safety and integrates seamlessly with the MCP SDK ecosystem.

## Critical MCP Implementation Rules

These rules prevent runtime errors and are essential for all MCP server implementations:

### Architecture Requirements
- **STATELESS DESIGN MANDATORY** - MCP servers MUST be stateless and connect on-demand
  - NO persistent connections on server startup
  - Create client connections when tools are called
  - Destroy connections immediately after tool execution
  - Containers should exit when stdin closes (after handling requests)
- **Framework Selection** - Default to **TypeScript/MCP SDK** unless the user's build prompt explicitly requests a different language (Python/FastMCP, Go, etc.)

### Tool Naming Convention
- **REQUIRED FORMAT**: `[service_name]_[tool_name]` (all lowercase with underscores)
- Examples:
  - `discord_send_message` ✅
  - `github_create_pr` ✅
  - `slack_post_message` ✅
  - NOT `send-message` ❌
  - NOT `SendMessage` ❌
  - NOT `send_message` ❌ (missing service prefix)

### Code Structure Rules
- **NO `@mcp.prompt()` decorators** - They break Claude Desktop integration
- **NO `prompt` parameter to FastMCP()** - Use only the server name: `FastMCP("server_name")`
- **NO complex type hints from typing module** - Avoid `Optional`, `Union`, `List[str]`, `Dict[str, Any]`, etc.
- **NO `None` defaults** - Always default parameters to empty strings: `param: str = ""` not `param: str = None`
- **SINGLE-LINE docstrings ONLY** - Multi-line docstrings cause gateway panic errors
- **All tools must return strings** - Return formatted string responses, never raw objects or lists
- **NO parameter unwrapping** - Modern FastMCP passes parameters directly; never create `unwrap_param()` functions or similar workarounds

### Parameter Handling
- **Use parameters directly** - FastMCP passes parameters as their declared types (no unwrapping needed)
- **All parameters MUST have default values** - Use `param: str = ""` for all string parameters
- **Check empty strings using `.strip()`**: `if not endpoint.strip():`
- Never rely on falsy checks alone
- Convert string parameters as needed: `int(limit) if limit.strip() else 10`

### Error Handling
- Every tool must have proper try/except blocks
- Return user-friendly error messages: `return f"❌ Error: {str(e)}"`
- Log errors to stderr using the logging module

### Docker Requirements
- All MCP servers must run in Docker containers
- Use `python:3.11-slim` as base image
- Create non-root user (`mcpuser`)
- Set `PYTHONUNBUFFERED=1` environment variable
- Log to stderr with ISO format timestamps

## Common MCP Server Pattern

A typical tool follows this structure:

```python
@mcp.tool()
async def tool_name(param1: str = "", param2: str = "") -> str:
    """Single-line description of what this tool does."""
    logger.info(f"Executing tool_name with {param1}")

    if not param1.strip():
        return "❌ Error: param1 is required"

    try:
        # Implementation here
        result = "success"
        return f"✅ Result: {result}"
    except Exception as e:
        logger.error(f"Error: {e}")
        return f"❌ Error: {str(e)}"
```

## File Organization and Saving Convention

Each MCP server is created in its own subdirectory under `$env:USERPROFILE\Repos\Personal\MCPs\` following the naming pattern `[service-name]-mcp`.

Standard MCP server project structure for each subdirectory:
```
$env:USERPROFILE\Repos\Personal\MCPs\
├── discord-mcp/                          (TypeScript example)
│   ├── src/
│   │   ├── index.ts                      (main server)
│   │   ├── tools/
│   │   │   ├── discord_send_message.ts   (tool files with underscores)
│   │   │   ├── discord_read_messages.ts
│   │   │   └── ...
│   │   └── utils/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── readme.md
│   └── CLAUDE.md (optional)
├── slack-mcp/                            (Python example)
│   ├── slack_server.py                   (main server with underscores)
│   ├── Dockerfile
│   ├── requirements.txt
│   └── readme.md
└── ...
```

**File saving convention:**
- Create subdirectory: `[service-name]-mcp` (use hyphens)
- Main server file: `[service_name]_server.py` (Python) or `[service_name]_*.ts` (TypeScript)
- Tool files: `[service_name]_[tool_name].ts` or `[service_name]_[tool_name].py` (use underscores)
- Docker image name: `[service-name]-mcp` (used in `docker build -t [service-name]-mcp .`)
- Save all files to: `$env:USERPROFILE\Repos\Personal\MCPs\[service-name]-mcp\`

**Examples:**
- Directory: `discord-mcp/` (hyphen)
- Tool files: `discord_send_message.ts`, `discord_read_messages.ts` (underscores)
- Tool names: `discord_send_message`, `discord_read_messages` (underscores)

**Automatic post-creation steps:**
After saving all files, Claude Code will automatically:
1. Build the Docker image: `docker build -t [service-name]-mcp $env:USERPROFILE/Repos/Personal/MCPs/[service-name]-mcp`
2. Add the server entry to: `$env:USERPROFILE\.docker\mcp\catalogs\my-custom-catalog.yaml`
3. Provide setup instructions for the user to add any required secrets

**IMPORTANT - Docker Path Syntax:**
- Docker commands require forward slashes (`/`) for paths, even on Windows
- ✅ Correct: `docker build -t name C:/Users/path/to/dir`
- ❌ Incorrect: `docker build -t name C:\Users\path\to\dir`

## Creating Documentation with docs-guide-writer Agent

**IMPORTANT**: When creating or updating README.md files for MCP servers, use the `docs-guide-writer` agent to ensure consistent, high-quality documentation.

### How to Use the docs-guide-writer Agent

When you need to create or improve a readme.md for an MCP server:

```
Use the Task tool with:
- subagent_type: "docs-guide-writer"
- Provide the MCP server name, description, tools list, and any existing documentation
- Ask the agent to generate or improve the README.md
- The agent will create comprehensive, well-structured documentation
```

### What the docs-guide-writer Agent Provides

The agent will create documentation that includes:
- Clear service description and purpose
- Feature list with all tools
- Prerequisites and installation steps
- Usage examples for each tool
- Architecture diagram
- Development guidelines
- Troubleshooting section
- Security considerations
- License information

### Example Usage

```
Task Description: "Create README.md for Discord MCP server"

Prompt: "Create a comprehensive README.md for a Discord MCP server that provides tools for:
- discord_send_message: Send messages to Discord channels
- discord_read_messages: Read message history from channels
- discord_create_thread: Create conversation threads

The server is built in TypeScript using the MCP SDK. Include installation steps, usage examples, and troubleshooting guidance."
```

### When to Use docs-guide-writer

✅ **Use the agent when:**
- Creating new MCP server documentation
- Updating existing readme.md files
- Need consistent documentation structure
- Documentation needs to be comprehensive and professional
- Improving clarity or completeness of existing docs

❌ **Don't use the agent when:**
- Making minor typo fixes (edit directly)
- Adding a single line of information
- Quick README stubs for templates

## Catalog Configuration for Secrets

**CRITICAL**: When MCP servers require secrets (API keys, tokens, etc.), use the `secrets` format in the catalog YAML, NOT the `env` format:

```yaml
[service-name]-mcp:
  title: Service Name MCP Server
  image: [service-name]-mcp
  tools:
    - name: [service]_tool_name
  secrets:
    - name: SECRET_NAME
      env: SECRET_NAME
      example: "example-value-format"
  prompts: 0
```

**Why this format is required:**
- The `secrets` section with `env: SECRET_NAME` mapping ensures the Docker Desktop MCP gateway correctly passes the secret value to the container
- Using plain `env:` at the top level will NOT work for secrets
- This is the correct pattern used in the discord-mcp server

**Setting secrets:**
```bash
docker mcp secret set SECRET_NAME="actual-secret-value"
docker mcp secret ls  # Verify
```

## API Integration Patterns

For external API calls:

```python
async with httpx.AsyncClient() as client:
    try:
        response = await client.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        return f"✅ Result: {formatted_data}"
    except httpx.HTTPStatusError as e:
        return f"❌ API Error: {e.response.status_code}"
    except Exception as e:
        return f"❌ Error: {str(e)}"
```

## System Command Execution

When executing system commands:

```python
import subprocess

try:
    result = subprocess.run(
        command,
        capture_output=True,
        text=True,
        timeout=10,
        shell=True  # Only if necessary
    )
    if result.returncode == 0:
        return f"✅ Output:\n{result.stdout}"
    else:
        return f"❌ Error:\n{result.stderr}"
except subprocess.TimeoutExpired:
    return "⏱️ Command timed out"
```

## Output Formatting

Use emoji prefixes for clarity:
- ✅ Success operations
- ❌ Errors or failures
- ⏱️ Time-related information
- 📊 Data or statistics
- 🔍 Search or lookup operations
- ⚡ Actions or commands
- 🔒 Security-related information
- 📁 File operations
- 🌐 Network operations
- ⚠️ Warnings

## Building and Testing

### Build Docker Image
```bash
# From within the MCP server directory (using relative path)
docker build -t [server-name]-mcp .

# Or with full path (use forward slashes on Windows)
docker build -t [server-name]-mcp $env:USERPROFILE/Repos/Personal/MCPs/[service-name]-mcp
```

### Local Testing
```bash
# Set environment variables
export SOME_SECRET="test-value"

# Run directly
python [server_name]_server.py

# Test MCP protocol
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | python [server_name]_server.py
```

## Configuration and Deployment

MCP servers are configured through:
1. **Docker Desktop Secrets** - For API keys and authentication
2. **Custom Catalog** - YAML file listing available tools
3. **Claude Config** - JSON configuration pointing to the MCP Gateway

See MCP_Builder_Instruction_Template.md for detailed setup instructions.

## Platform-Specific Command Syntax

**CRITICAL**: Commands must use the correct syntax for your shell environment. Using PowerShell syntax in bash (or vice versa) will cause failures.

### Windows PowerShell (Native Windows)

**Environment Variable Expansion**: Use `$env:USERPROFILE`
```powershell
# Correct - PowerShell syntax
mkdir "$env:USERPROFILE\Repos\Personal\MCPs\test-mcp"
code "$env:USERPROFILE\.docker\mcp\catalogs\custom.yaml"

# Docker commands use forward slashes
docker build -t test-mcp $env:USERPROFILE/Repos/Personal/MCPs/test-mcp

# Correct escaping in PowerShell
$path = "$env:USERPROFILE\Repos\Personal\MCPs"
```

**❌ WRONG - Bash syntax in PowerShell**
```powershell
mkdir ~\Repos\Personal\MCPs\test-mcp  # Will fail
mkdir $HOME\Repos\Personal\MCPs       # Undefined in PowerShell
```

### Bash/WSL (Windows Subsystem for Linux or Git Bash)

**Environment Variable Expansion**: Use `~` or `$HOME` (NOT `$env:USERPROFILE`)
```bash
# Correct - Bash syntax
mkdir -p ~/Repos/Personal/MCPs/test-mcp
nano ~/.docker/mcp/catalogs/custom.yaml

# In WSL, paths can use /mnt/c/Users/...
mkdir -p /mnt/c/Users/WillLyons/Repos/Personal/MCPs/test-mcp

# Docker commands use forward slashes
docker build -t test-mcp ~/Repos/Personal/MCPs/test-mcp
```

**❌ WRONG - PowerShell syntax in Bash**
```bash
mkdir "$env:USERPROFILE\Repos\Personal\MCPs"  # Will fail - $env not defined
mkdir "C:\Users\WillLyons"                     # Backslashes don't work in bash
```

### Git Bash on Windows

**Environment Variable Expansion**: Use `~` or `$HOME`
```bash
# Correct - Git Bash syntax
mkdir -p ~/Repos/Personal/MCPs/test-mcp
code ~/.docker/mcp/catalogs/custom.yaml

# Docker commands use forward slashes
docker build -t test-mcp ~/Repos/Personal/MCPs/test-mcp
```

### Key Rules for Each Shell

| Shell | Home Variable | Path Separator | Variable Syntax | mkdir | Editor |
|-------|---------------|----------------|-----------------|-------|--------|
| **PowerShell** | `$env:USERPROFILE` | `\` or `/` | `$env:VAR` | `mkdir` | `code` |
| **Bash/WSL** | `~` or `$HOME` | `/` | `$VAR` | `mkdir -p` | `nano` or `code` |
| **Git Bash** | `~` or `$HOME` | `/` | `$VAR` | `mkdir -p` | `nano` or `code` |

### Docker Commands (Universal)

**Always use forward slashes for Docker, regardless of shell**:
```powershell
# PowerShell
docker build -t name $env:USERPROFILE/Repos/Personal/MCPs/name-mcp
```

```bash
# Bash/WSL/Git Bash
docker build -t name ~/Repos/Personal/MCPs/name-mcp
```

## Common Issues and Solutions

| Issue | Solution | Prevention |
|-------|----------|-----------|
| "Gateway panic error" | Check docstrings are single-line only | Pre-build verification checklist (see below) |
| Tools not appearing in Claude | Verify Docker image built, catalog updated, Claude restarted | Validate build steps before deployment |
| Type validation errors | Use simple types (str, int) with empty string defaults | Use TypeScript strict mode during development |
| Authentication failures | Verify Docker secrets are set and environment variable names match | Document all required secrets upfront |
| Timeout issues | Increase timeouts in httpx/subprocess calls | Test locally before Docker build |
| Docker build fails with "context" errors | Ensure all source files are in project directory | Include proper .gitignore to prevent large files |
| UID collision in container | Use unique UID (e.g., 9001) instead of common ones | Always use UID > 5000 for custom users |
| npm package integrity errors | Delete package-lock.json and regenerate | Use `npm install` instead of `npm ci` for fresh installs |
| TypeScript compilation failures | Check tsconfig.json strict mode settings | Run `npm run build` locally before Docker build |
| "mkdir not found" or path errors | Verify you're using correct shell syntax for your environment | Check Platform-Specific Command Syntax section above |
| Variable expansion not working | Ensure `$env:USERPROFILE` in PowerShell, `~` or `$HOME` in Bash | Reference correct syntax for your shell |

## Pre-Build Verification Checklist

Before building any MCP server Docker image, verify:

### TypeScript/Node.js Specific
- [ ] `tsconfig.json` exists and is properly configured
- [ ] `package.json` has correct `"build"` script that runs TypeScript compiler
- [ ] No stale `package-lock.json` (delete if issues arise and let Docker regenerate)
- [ ] `src/` directory exists with main `index.ts` file
- [ ] All imports use correct paths (relative paths for local files)
- [ ] No hardcoded absolute paths in code

### Docker Specific
- [ ] Dockerfile uses proper multi-stage build: `FROM ... AS builder` then `FROM ... AS production`
- [ ] Builder stage includes TypeScript compilation (`npm run build`)
- [ ] Production stage copies only necessary artifacts from builder (`COPY --from=builder`)
- [ ] User creation UID is unique (use >5000, not 1000 which may already exist)
- [ ] All COPY commands reference files that exist in project
- [ ] No circular COPY dependencies

### File Structure
- [ ] `.gitignore` excludes: `node_modules/`, `build/`, `dist/`, `*.js`, `*.js.map`
- [ ] All source files are TypeScript (`.ts`), not JavaScript (`.js`)
- [ ] No build artifacts committed to git
- [ ] `readme.md` documents all required setup steps

### Configuration
- [ ] All hardcoded paths use `$env:USERPROFILE` (Windows PowerShell) or `~` (Bash/WSL)
- [ ] No hardcoded API keys or secrets in code
- [ ] Tool names follow `[service]_[toolname]` format (all lowercase, underscores)
- [ ] All tool docstrings are single-line only
- [ ] Single-line docstrings (multi-line will cause "Gateway panic error")

### Testing Before Docker
- [ ] Run locally with `npm install && npm run build && npm start` (if possible)
- [ ] Verify no TypeScript compilation errors
- [ ] Test at least one tool endpoint with JSON-RPC
- [ ] Verify tools/list endpoint returns expected structure

### Build Command Verification
- [ ] Using correct shell syntax for your environment (PowerShell vs Bash)
- [ ] Docker path uses forward slashes: `docker build -t name $env:USERPROFILE/path`
- [ ] Image name follows pattern: `[service-name]-mcp` (lowercase with hyphens)
- [ ] Build completes without warnings about Dockerfile casing

## When Working on MCP Servers

1. **Review the template** - Reference MCP_Builder_Instruction_Template.md for complete patterns
2. **Follow the structure** - Use the same Dockerfile, package.json, and src/index.ts layout
3. **Test docstrings** - Ensure all tool docstrings are exactly one line
4. **Validate types** - Use simple types (string, number) with proper defaults
5. **Check error handling** - Every tool must have try/catch with user-friendly messages
6. **Use Pre-Build Checklist** - Run through verification checklist before Docker build
7. **Check Platform Syntax** - Verify you're using correct shell commands for your environment
8. **Build and verify** - Always build the Docker image and test with JSON-RPC endpoints

## Version Control and Git Workflow

All MCP server development is version-controlled with Git and hosted on GitHub at `https://github.com/DoctorBrobotnik/MCPs`.

### Git Workflow for MCP Development

**When implementing new tools or features:**

1. **Create a feature branch** (optional, for larger features):
   ```bash
   git checkout -b feature/tool-name
   ```

2. **Make changes to source files** (src/, utils/, etc.)

3. **Build and test locally**:
   ```bash
   npm run build
   docker build -t [service-name]-mcp .
   ```

4. **Stage your changes**:
   ```bash
   git add .
   ```

5. **Commit with descriptive message**:
   ```bash
   git commit -m "Add [tool_name] tool - [description]"
   ```

6. **Push to GitHub**:
   ```bash
   git push origin main  # or your feature branch
   ```

### Commit Message Guidelines

- Use imperative mood: "Add tool" not "Added tool"
- Start with what was added/changed: "Add discord_create_thread tool"
- Include a brief description: "Add discord_create_thread tool - Create conversation threads with auto-archive"
- Reference planning documents when relevant: "Implement Tier 1 tools from TIER1_IMPLEMENTATION_PLAN.md"

### Important Notes

- The `.gitignore` file automatically excludes:
  - `node_modules/`, `build/`, `dist/` directories
  - `.env` files and all secrets
  - IDE files and OS clutter
  - Compiled JavaScript and map files

- **Never commit**:
  - `.env` files or credentials
  - Discord bot tokens (use Docker secrets instead)
  - Build artifacts (automatically ignored)
  - node_modules (automatically ignored)

- **Always commit**:
  - Source code (`src/` directory)
  - Configuration files (package.json, tsconfig.json, Dockerfile)
  - Documentation (README.md, planning documents)
  - Test files and examples

### Planning Documents in Git

Planning documents serve as persistent records of implementation strategy:
- `TIER1_IMPLEMENTATION_PLAN.md` - Detailed specs for 10 essential tools
- `FUTURE_TOOLS.md` - Recommendations for Tier 2-4 tools
- These should be committed and updated as implementation progresses

---

## Setup Instructions for Users

When creating a new MCP server, include a simplified setup section in the readme that:

1. **Shows how to build the Docker image:**
   ```bash
   # From the service directory
   docker build -t [service-name]-mcp .

   # Or with full path (Windows users: use forward slashes)
   docker build -t [service-name]-mcp $env:USERPROFILE/Repos/Personal/MCPs/[service-name]-mcp
   ```

2. **Explains how to add any required secrets:**
   For each secret the server needs (API keys, tokens, etc.):
   ```bash
   docker mcp secret set SECRET_NAME="your-secret-value-here"
   ```

   Always include:
   - What the secret is for (e.g., "Discord bot token")
   - Where to get it (e.g., "from Discord Developer Portal")
   - How to verify it was set: `docker mcp secret ls`

3. **Notes that catalog is automatic:**
   State clearly: "The [service-name]-mcp server entry has been automatically added to your custom catalog at `$env:USERPROFILE\.docker\mcp\catalogs\my-custom-catalog.yaml`"

4. **Restart instruction:**
   Simple final step: "Restart Claude and the tools will appear"

**Example format for secrets section:**
```
### Step 3: Add Required Secrets

#### Discord Bot Token
Store your Discord bot token securely:
```bash
docker mcp secret set DISCORD_TOKEN="your-bot-token-here"
```

Get your token from:
1. Discord Developer Portal → Applications
2. Your application → Bot → TOKEN (Copy)

Verify the secret was created:
```bash
docker mcp secret ls
```
```
