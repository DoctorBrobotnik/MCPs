# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This repository contains **MCP_Builder_Instruction_Template.md**, a comprehensive guide for building Model Context Protocol (MCP) servers. MCP servers are tools that extend Claude's capabilities by exposing custom tools and resources through the Model Context Protocol.

## FastMCP Documentation

**ALWAYS reference the official FastMCP documentation** when building MCP servers:
- **Official Docs**: https://gofastmcp.com
- **GitHub**: https://github.com/jlowin/fastmcp
- **PyPI**: https://pypi.org/project/fastmcp/

The FastMCP documentation is the authoritative source for:
- Tool parameter handling (no parameter wrapping/unwrapping needed)
- Supported parameter types and type hints
- Best practices for tool definitions
- Context API usage
- Return value formatting

## Critical MCP Implementation Rules

These rules prevent runtime errors and are essential for all MCP server implementations:

### Architecture Requirements
- **STATELESS DESIGN MANDATORY** - MCP servers MUST be stateless and connect on-demand
  - NO persistent connections on server startup
  - Create client connections when tools are called
  - Destroy connections immediately after tool execution
  - Containers should exit when stdin closes (after handling requests)
- **Framework Selection** - If user doesn't specify, ask which framework to use (Python/FastMCP, TypeScript/MCP SDK, etc.)

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

Each MCP server is created in its own subdirectory under `C:\Users\WillLyons\Repos\Personal\MCPs\` following the naming pattern `[service-name]-mcp`.

Standard MCP server project structure for each subdirectory:
```
C:\Users\WillLyons\Repos\Personal\MCPs\
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
- Save all files to: `C:\Users\WillLyons\Repos\Personal\MCPs\[service-name]-mcp\`

**Examples:**
- Directory: `discord-mcp/` (hyphen)
- Tool files: `discord_send_message.ts`, `discord_read_messages.ts` (underscores)
- Tool names: `discord_send_message`, `discord_read_messages` (underscores)

**Automatic post-creation steps:**
After saving all files, Claude Code will automatically:
1. Build the Docker image: `docker build -t [service-name]-mcp C:/Users/WillLyons/Repos/Personal/MCPs/[service-name]-mcp`
2. Add the server entry to: `C:\Users\WillLyons\.docker\mcp\catalogs\my-custom-catalog.yaml`
3. Provide setup instructions for the user to add any required secrets

**IMPORTANT - Docker Path Syntax:**
- Docker commands require forward slashes (`/`) for paths, even on Windows
- ✅ Correct: `docker build -t name C:/Users/path/to/dir`
- ❌ Incorrect: `docker build -t name C:\Users\path\to\dir`

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
docker build -t [server-name]-mcp C:/Users/WillLyons/Repos/Personal/MCPs/[service-name]-mcp
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
3. **Claude Desktop Config** - JSON configuration pointing to the MCP Gateway

See MCP_Builder_Instruction_Template.md for detailed setup instructions.

## Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| "Gateway panic error" | Check docstrings are single-line only |
| Tools not appearing in Claude | Verify Docker image built, catalog updated, Claude restarted |
| Type validation errors | Use simple types (str, int) with empty string defaults |
| Authentication failures | Verify Docker secrets are set and environment variable names match |
| Timeout issues | Increase timeouts in httpx/subprocess calls |

## When Working on MCP Servers

1. **Review the template** - Reference MCP_Builder_Instruction_Template.md for complete patterns
2. **Follow the structure** - Use the same Dockerfile, requirements.md, and server.py layout
3. **Test docstrings** - Ensure all tool docstrings are exactly one line
4. **Validate types** - Never use Optional, Union, List, or None defaults
5. **Check error handling** - Every tool must have try/except with user-friendly messages
6. **Build and verify** - Always build the Docker image and test locally before deployment

## Setup Instructions for Users

When creating a new MCP server, include a simplified setup section in the readme that:

1. **Shows how to build the Docker image:**
   ```bash
   # From the service directory
   docker build -t [service-name]-mcp .

   # Or with full path (Windows users: use forward slashes)
   docker build -t [service-name]-mcp C:/Users/WillLyons/Repos/Personal/MCPs/[service-name]-mcp
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
   State clearly: "The [service-name]-mcp server entry has been automatically added to your custom catalog at `C:\Users\WillLyons\.docker\mcp\catalogs\my-custom-catalog.yaml`"

4. **Restart instruction:**
   Simple final step: "Restart Claude Desktop and the tools will appear"

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
