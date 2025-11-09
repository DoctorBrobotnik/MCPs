# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This is a **public repository** that contains Model Context Protocol (MCP) servers. MCP servers are tools that extend Claude's capabilities by exposing custom tools and resources through the Model Context Protocol.

**MCP servers in this repository are built and published automatically via GitHub Actions CI/CD workflow.** When code is pushed to this repository, a GitHub Actions workflow automatically:
1. Builds Docker images for each MCP server
2. Pushes images to GitHub Container Registry (GHCR)
3. Makes images available for immediate use

Users no longer need to build Docker images locally—pre-built images are available from the registry.

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
- **Base Images by Language:**
  - TypeScript: Use `node:18-slim` or `node:20-slim`
  - Python: Use `python:3.11-slim` or `python:3.12-slim`
- Create non-root user (`mcpuser` with UID > 5000)
- **Environment Variables:**
  - TypeScript: Set `NODE_ENV=production`
  - Python: Set `PYTHONUNBUFFERED=1`
- Log to stderr with ISO format timestamps
- Use multi-stage builds for TypeScript (builder + production stages)

## Common MCP Server Pattern (Python)

A typical Python tool using FastMCP follows this structure:

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

## Common MCP Server Pattern (TypeScript)

A typical TypeScript MCP server tool follows this structure using the official MCP SDK:

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Initialize server
const server = new Server(
  {
    name: "service-name-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "service_tool_name",
        description: "Single-line description of what this tool does",
        inputSchema: {
          type: "object",
          properties: {
            param1: {
              type: "string",
              description: "Description of param1",
            },
            param2: {
              type: "string",
              description: "Description of param2",
            },
          },
          required: ["param1"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "service_tool_name") {
    return await handleToolName(args);
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Tool implementation
async function handleToolName(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
  const param1 = args.param1 as string;
  const param2 = (args.param2 as string) || "";

  console.error(`[${new Date().toISOString()}] Executing service_tool_name with param1=${param1}`);

  // Validate required parameters
  if (!param1 || param1.trim() === "") {
    return {
      content: [
        {
          type: "text",
          text: "❌ Error: param1 is required",
        },
      ],
    };
  }

  try {
    // Implementation here
    const result = "success";

    return {
      content: [
        {
          type: "text",
          text: `✅ Result: ${result}`,
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${new Date().toISOString()}] Error: ${errorMessage}`);

    return {
      content: [
        {
          type: "text",
          text: `❌ Error: ${errorMessage}`,
        },
      ],
    };
  }
}

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[${new Date().toISOString()}] Service MCP server running on stdio`);
}

main().catch((error) => {
  console.error(`[${new Date().toISOString()}] Fatal error:`, error);
  process.exit(1);
});
```

**Key TypeScript patterns:**
- Use official `@modelcontextprotocol/sdk` package
- Register tools via `ListToolsRequestSchema` handler
- Handle tool calls via `CallToolRequestSchema` handler
- Return objects with `content` array containing `{type: "text", text: "..."}` structures
- Log to `console.error()` for stderr output with ISO timestamps
- Use proper TypeScript types for parameters and return values
- Validate parameters explicitly (check for undefined, null, empty strings)
- Handle errors with try/catch and return user-friendly messages

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
│   ├── README.md                         (uppercase for GitHub convention)
│   └── CLAUDE.md (optional)
├── slack-mcp/                            (Python example)
│   ├── slack_server.py                   (main server with underscores)
│   ├── Dockerfile
│   ├── requirements.txt
│   └── README.md                         (uppercase for GitHub convention)
└── ...
```

**File saving convention:**
- Create subdirectory: `[service-name]-mcp` (use hyphens)
- Main server file: `[service_name]_server.py` (Python) or `[service_name]_*.ts` (TypeScript)
- Tool files: `[service_name]_[tool_name].ts` or `[service_name]_[tool_name].py` (use underscores)
- Docker image name: `[service-name]-mcp` (used in `docker build -t [service-name]-mcp .`)
- Documentation file: `README.md` (uppercase - standard GitHub convention)
- Save all files to: `$env:USERPROFILE\Repos\Personal\MCPs\[service-name]-mcp\`

**Examples:**
- Directory: `discord-mcp/` (hyphen)
- Documentation: `README.md` (uppercase)
- Tool files: `discord_send_message.ts`, `discord_read_messages.ts` (underscores)
- Tool names: `discord_send_message`, `discord_read_messages` (underscores)

**GitHub Actions CI/CD Workflow:**
After committing and pushing files to GitHub, the automated workflow will:
1. Detect new/changed MCP server directories
2. Build Docker images for each server
3. Run automated tests and validation
4. Push images to GitHub Container Registry (GHCR): `ghcr.io/doctorbrobotnik/[service-name]-mcp`
5. Images are immediately available for use without local building

**User Setup Instructions:**
Users can now pull pre-built images directly:
```bash
docker pull ghcr.io/doctorbrobotnik/[service-name]-mcp:latest
```

No local Docker builds are required—the repository's GitHub Actions workflow handles all image building and publishing.

## Creating Documentation with docs-guide-writer Agent

**IMPORTANT**: When creating or updating README.md files for MCP servers, use the `docs-guide-writer` agent to ensure consistent, high-quality documentation.

### How to Use the docs-guide-writer Agent

When you need to create or improve a README.md for an MCP server:

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
- Updating existing README.md files
- Need consistent documentation structure
- Documentation needs to be comprehensive and professional
- Improving clarity or completeness of existing docs

❌ **Don't use the agent when:**
- Making minor typo fixes (edit directly)
- Adding a single line of information
- Quick README stubs for templates

## Catalog Configuration for Secrets and CI/CD Images

When registering MCP servers in the custom catalog, follow these guidelines:

### For Servers with Secrets (API keys, tokens, etc.)

Use the `secrets` format in catalog YAML:

```yaml
[service-name]-mcp:
  title: Service Name MCP Server
  type: server
  source: remote
  image: ghcr.io/doctorbrobotnik/[service-name]-mcp:latest
  tools:
    - name: [service]_tool_name
  secrets:
    - name: SECRET_NAME
      env: SECRET_NAME
      example: "example-value-format"
  prompts: 0
```

**Why this format is required:**
- The `secrets` section with `env: SECRET_NAME` mapping ensures the Docker Desktop MCP gateway correctly passes secrets to the container
- Using plain `env:` at the top level will NOT work for secrets
- This pattern works consistently with both local and GitHub Actions-built images

**Setting secrets locally:**
```bash
docker mcp secret set SECRET_NAME="actual-secret-value"
docker mcp secret ls  # Verify
```

### For Remote GHCR Images

When using images from GitHub Container Registry (built via GitHub Actions):

- **source**: Set to `remote` (not `local`)
- **image**: Use full GHCR URL: `ghcr.io/doctorbrobotnik/[service-name]-mcp:latest`
- Docker automatically pulls these images when enabled
- Images update automatically when code is pushed to the repository

## API Integration Patterns

### Python (httpx)

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

### TypeScript (fetch API)

For external API calls in TypeScript, use the native `fetch` API with proper error handling:

```typescript
async function callExternalAPI(url: string, apiKey: string): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "MCP-Server/1.0",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      return {
        content: [
          {
            type: "text",
            text: `❌ API Error: ${response.status} ${response.statusText}\n${errorText}`,
          },
        ],
      };
    }

    const data = await response.json();
    const formattedData = JSON.stringify(data, null, 2);

    return {
      content: [
        {
          type: "text",
          text: `✅ Result:\n${formattedData}`,
        },
      ],
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        content: [
          {
            type: "text",
            text: "⏱️ Request timed out after 10 seconds",
          },
        ],
      };
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${new Date().toISOString()}] API Error: ${errorMessage}`);

    return {
      content: [
        {
          type: "text",
          text: `❌ Error: ${errorMessage}`,
        },
      ],
    };
  }
}
```

**Advanced: Retry Logic with Exponential Backoff**

For APIs that may be temporarily unavailable:

```typescript
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Retry on 5xx errors or 429 (rate limit)
      if (response.status >= 500 || response.status === 429) {
        throw new Error(`Server error: ${response.status}`);
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
        console.error(`[${new Date().toISOString()}] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Max retries exceeded");
}
```

**Best practices:**
- Always set timeouts using `AbortController`
- Handle HTTP errors explicitly (check `response.ok`)
- Log errors to stderr with timestamps
- Return user-friendly error messages with emoji prefixes
- Use retry logic for transient failures (5xx, 429)
- Implement exponential backoff to avoid overwhelming APIs

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

### Automated Builds via GitHub Actions

MCP server Docker images are **automatically built and published** via GitHub Actions CI/CD workflow. When you push code to the repository:

1. GitHub Actions automatically detects changes to MCP server directories
2. Builds Docker images for each modified server
3. Pushes images to GitHub Container Registry (GHCR)
4. Images become available immediately at: `ghcr.io/doctorbrobotnik/[service-name]-mcp:latest`

**Benefits of CI/CD:**
- ✅ Consistent builds in standardized environment
- ✅ Automated testing before image publication
- ✅ Users get pre-built images without local Docker
- ✅ Automatic version management and tagging

### Local Testing (Development Only)

#### TypeScript

For TypeScript MCP servers, follow these testing steps:

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run build

# Set environment variables (PowerShell)
$env:SOME_SECRET="test-value"

# Set environment variables (Bash)
export SOME_SECRET="test-value"

# Run the server
npm start
# Or run compiled JavaScript directly
node build/index.js
```

**Test MCP Protocol (PowerShell):**
```powershell
'{"jsonrpc":"2.0","method":"tools/list","id":1}' | node build/index.js
```

**Test MCP Protocol (Bash):**
```bash
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node build/index.js
```

**Expected Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "service_tool_name",
        "description": "Single-line description of what this tool does",
        "inputSchema": {
          "type": "object",
          "properties": {
            "param1": {
              "type": "string",
              "description": "Description of param1"
            }
          },
          "required": ["param1"]
        }
      }
    ]
  }
}
```

**Test Tool Execution:**
```bash
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"service_tool_name","arguments":{"param1":"test"}},"id":2}' | node build/index.js
```

**Debugging TypeScript Issues:**
```bash
# Check TypeScript compilation errors
npm run build

# Run with verbose logging
NODE_ENV=development npm start

# Check for missing dependencies
npm list --depth=0

# Verify TypeScript configuration
cat tsconfig.json
```

**Common TypeScript Test Failures:**

| Issue | Cause | Solution |
|-------|-------|----------|
| `Cannot find module` | Missing import or wrong path | Check import paths in `src/` files |
| `Type 'X' is not assignable` | Type mismatch | Review function signatures and types |
| `Module not found: @modelcontextprotocol/sdk` | Missing dependency | Run `npm install @modelcontextprotocol/sdk` |
| No output when piping JSON | Server crashed on startup | Check `console.error()` output for errors |
| `SyntaxError: Unexpected token` | Invalid JSON in test | Validate JSON with `jq` or online validator |

#### Python

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
- [ ] `README.md` documents all required setup steps

### Configuration
- [ ] All hardcoded paths use `$env:USERPROFILE` (Windows PowerShell) or `~` (Bash/WSL)
- [ ] No hardcoded API keys or secrets in code
- [ ] Tool names follow `[service]_[toolname]` format (all lowercase, underscores)
- [ ] All tool docstrings are single-line only (multi-line will cause "Gateway panic error")

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

## Code Review Before Implementation

**MANDATORY**: When generating new MCP server code, you MUST use the `code-reviewer` agent to review the generated code BEFORE implementation or file creation.

### Code Review Workflow

For **all new MCP server implementations**:

1. **Generate the code** - Create all source code, Dockerfile, package.json, etc.
2. **Review with code-reviewer agent** - Use the Task tool with subagent_type: `code-reviewer` to review:
   - MCP protocol compliance (correct schema, types, handlers)
   - Error handling (proper try/catch, validation, error messages)
   - Security issues (no hardcoded secrets, proper input validation, safe API calls)
   - Code quality (naming conventions, structure, patterns)
   - Docker configuration (multi-stage builds, proper permissions, env vars)
   - Configuration files (tsconfig.json, package.json, Dockerfile)
3. **Address findings** - Fix any issues identified by the reviewer
4. **Final review** - Get code-reviewer approval before proceeding with file creation
5. **Implement files** - Create actual files and Docker image only after code review is complete

### What code-reviewer Checks For

The code-reviewer agent will analyze:
- ✅ Correct MCP SDK usage (ImportSchema, tool handlers, return format)
- ✅ Parameter validation (required fields, type checking, empty string handling)
- ✅ Error handling completeness (all code paths have try/catch or validation)
- ✅ Tool naming conventions (`service_name_tool_name` format)
- ✅ Docstring format (single-line only, no multi-line descriptions)
- ✅ Type safety (proper TypeScript types, no `any` unless necessary)
- ✅ Security issues (injection risks, hardcoded credentials, unsafe operations)
- ✅ Docker best practices (non-root user, proper base images, multi-stage builds)
- ✅ Timeout handling (API calls have timeouts, subprocess calls have timeouts)
- ✅ Logging (proper stderr output with ISO timestamps)
- ✅ Return format compliance (content array with type/text structure)

### Example Usage

```
Task Description: "Review Discord MCP server code"

Prompt: "Please thoroughly review this Discord MCP server TypeScript code for:
1. MCP SDK compliance and proper protocol implementation
2. Security vulnerabilities (hardcoded tokens, injection risks)
3. Error handling completeness
4. Docker configuration
5. Code quality and naming conventions

Here is the code:
[paste all source files, Dockerfile, package.json, tsconfig.json]

Provide specific findings, severity level, and recommendations for fixes."
```

### When to Use code-reviewer

✅ **ALWAYS use code-reviewer when:**
- Creating new MCP servers from scratch
- Adding new major features or tools to existing servers
- Significant refactoring of existing code
- Before Docker build and deployment

❌ **Do NOT skip code review for:**
- Any new MCP server implementation
- Any code that handles authentication or secrets
- Any code that makes external API calls
- Any TypeScript/Node.js code

## When Working on MCP Servers

1. **Review the template** - Reference MCP_Builder_Instruction_Template.md for complete patterns
2. **Follow the structure** - Use the same Dockerfile, package.json, and src/index.ts layout
3. **Test docstrings** - Ensure all tool docstrings are exactly one line
4. **Validate types** - Use simple types (string, number) with proper defaults
5. **Check error handling** - Every tool must have try/catch with user-friendly messages
6. **Use Pre-Build Checklist** - Run through verification checklist before Docker build
7. **Check Platform Syntax** - Verify you're using correct shell commands for your environment
8. **Build and verify** - Always build the Docker image and test with JSON-RPC endpoints
9. **Code Review Required** - Use code-reviewer agent before implementing any new MCP servers

## Continuous Integration with GitHub Actions

This repository uses **GitHub Actions CI/CD** to automatically build and publish Docker images for all MCP servers.

### How It Works

**Workflow Trigger:** When code is pushed to the `main` branch:

1. **Detection** - GitHub Actions detects changes to MCP server directories
2. **Build** - Automatically builds Docker images for each modified server
3. **Testing** - Runs automated validation and tests on built images
4. **Publish** - Pushes images to GitHub Container Registry (GHCR)
5. **Available** - Images are immediately available at: `ghcr.io/doctorbrobotnik/[service-name]-mcp:latest`

### GitHub Actions Workflow File

The workflow configuration is located at: `.github/workflows/build-and-publish-mcps.yml`

**Key features:**
- ✅ Multi-platform builds (Linux x86_64 and ARM64)
- ✅ Automatic image tagging with commit SHA and `latest`
- ✅ Push to GitHub Container Registry (GHCR)
- ✅ Docker image metadata (labels, annotations)
- ✅ Secrets scanning and validation
- ✅ Buildx caching for faster builds

### Pulling Pre-Built Images

Users and developers can pull pre-built images directly:

```bash
# Pull the latest version
docker pull ghcr.io/doctorbrobotnik/[service-name]-mcp:latest

# Pull a specific version (by commit SHA)
docker pull ghcr.io/doctorbrobotnik/[service-name]-mcp:abc1234
```

### Image Registry Authentication

For pulling from GHCR, users may need to authenticate with GitHub:

```bash
# Login to GitHub Container Registry
echo ${{ github.token }} | docker login ghcr.io -u $ --password-stdin

# Or use a GitHub Personal Access Token (PAT)
echo "YOUR_PAT" | docker login ghcr.io -u USERNAME --password-stdin
```

### Benefits of CI/CD Approach

- **Consistency** - All images built in the same standardized environment
- **Automation** - No manual Docker build steps required
- **Testing** - Automated validation before publishing
- **Distribution** - Images available immediately after push
- **Versioning** - Automatic image tagging with commit information
- **User Experience** - Users pull pre-built images, no local builds needed
- **Updates** - Images automatically updated when code is pushed

### Development Workflow with CI/CD

Developers follow this workflow:

1. **Create/modify MCP server code** in a feature branch
2. **Test locally** with `npm run build && npm start` (for TypeScript)
3. **Push to GitHub** when ready
4. **GitHub Actions automatically:**
   - Builds the Docker image
   - Validates the image
   - Publishes to GHCR
5. **Users pull the image** from GHCR with `docker pull`

### Troubleshooting CI/CD Builds

**View build logs:**
1. Go to repository → Actions tab
2. Click on the workflow run
3. Check "Build" job logs for details

**Common issues:**
- **Image build fails** - Check Dockerfile syntax and dependencies in the workflow logs
- **Push fails** - Verify GHCR authentication and token permissions
- **Wrong image name** - Ensure Dockerfile exists in correct directory

### Monitoring Workflow Status

Check the status of automated builds:
- GitHub repository Actions tab shows all workflow runs
- Status badge in README indicates latest build status
- Failed workflows trigger GitHub notifications

---

## Version Control and Git Workflow

All MCP server development is version-controlled with Git and hosted on GitHub at `https://github.com/DoctorBrobotnik/MCPs`.

**CRITICAL: Git workflow is a MANDATORY FINAL STEP for every MCP server implementation. Do NOT skip this step.**

### Complete MCP Development Workflow (with Git, Catalog Registration, and Server Enable)

**The proper sequence for every MCP server implementation:**

1. **Plan** - Create implementation plan document
2. **Scaffold** - Create directory structure and configuration
3. **Code** - Implement all tools and utilities
4. **Review** - Use code-reviewer agent to verify quality
5. **Document** - Use docs-guide-writer agent to create README
6. **Test Locally** - Run `npm run build && npm start` to verify locally (no Docker build needed)
7. **Register in Catalog** ← **MANDATORY BEFORE GIT COMMIT**
8. **Backup Catalog to MCP_Catalogs Repo** ← **MANDATORY - Commit catalog changes to separate repo**
9. **Commit to MCPs Git** ← **PUSHES TRIGGER GITHUB ACTIONS BUILD**
10. **Push to GitHub** ← **GitHub Actions automatically builds and publishes Docker image to GHCR**
11. **Enable Server** - Users run `docker mcp server enable [service-name]-mcp`

### Catalog Registration for MCP Development

**Every new MCP server MUST be registered in the custom catalog BEFORE committing to git.**

**Location**: `$env:USERPROFILE/.docker/mcp/catalogs/my-custom-catalog.yaml`

**Required Entry Template (for GitHub Actions-built servers):**
```yaml
[service-name]-mcp:
  description: "[Service Name] MCP - [brief description of capabilities with tool count]"
  title: "[Service Name] MCP Server"
  type: server
  dateAdded: "[TODAY'S DATE IN ISO FORMAT - YYYY-MM-DDT00:00:00Z]"
  image: ghcr.io/doctorbrobotnik/[service-name]-mcp:latest
  source: remote
  upstream: https://github.com/DoctorBrobotnik/MCPs
  icon: "[URL to service icon or favicon]"
  tools:
    - name: [service_name]_[tool_name_1]
    - name: [service_name]_[tool_name_2]
    - name: [service_name]_[tool_name_3]
  secrets:
    - name: [SERVICE_API_KEY_OR_TOKEN]
      env: [SERVICE_API_KEY_OR_TOKEN]
      example: "example-format-for-documentation"
  prompts: 0
```

**Critical Catalog Fields:**
- **image**: Must be the full GHCR URL: `ghcr.io/doctorbrobotnik/[service-name]-mcp:latest`
- **source**: Always set to `remote` for GitHub Actions-built servers (not `local`)
- **tools**: List ALL tools provided by the MCP server (keep list synchronized with actual tools)
- **secrets**: List ALL required API keys, tokens, or credentials (use `secrets` format with `env:` mapping)
- **upstream**: Always reference `https://github.com/DoctorBrobotnik/MCPs`
- **icon**: Use official service icon/favicon URL if available

**Verification Steps After Registration:**
1. Validate YAML syntax: `cat my-custom-catalog.yaml` (no errors)
2. Verify image URL is correct GHCR path: `ghcr.io/doctorbrobotnik/[service-name]-mcp:latest`
3. Ensure all tools are listed in catalog and match actual server tools
4. Confirm all secrets are properly documented with examples
5. Check date added is today's date in ISO format
6. Verify `source: remote` is set (not `local`)

**Testing the Catalog Entry:**
After GitHub Actions builds and publishes the image, test with:
```bash
docker pull ghcr.io/doctorbrobotnik/[service-name]-mcp:latest
docker mcp server enable [service-name]-mcp
```

**Common Registration Errors:**
- ❌ Image URL not in GHCR format: Must be `ghcr.io/doctorbrobotnik/[service-name]-mcp:latest`
- ❌ Source set to `local` instead of `remote`: GitHub Actions builds use remote GHCR images
- ❌ Missing secrets section or using incorrect `env:` format at top level
- ❌ Tools list doesn't match actual tools in server
- ❌ Forgotten to update catalog before git commit

### Backup Catalogs to MCP_Catalogs Repository

**CRITICAL: Catalog changes MUST be committed to the MCP_Catalogs repository BEFORE committing to the MCPs repository.**

**Repository:** `https://github.com/DoctorBrobotnik/MCP_Catalogs.git`

**Catalog Files to Backup:**
- `my-custom-catalog.yaml` - Local MCP servers (Discord, n8n, Suno, etc.)
- `my-remote-catalog.yaml` - Remote MCP servers (Home Assistant SSE gateway)

**Mandatory Backup Workflow (Step 8 of MCP Development):**

1. **After registering in local catalog**, navigate to catalogs directory:
   ```bash
   cd $env:USERPROFILE/.docker/mcp/catalogs
   ```

2. **Stage the updated catalog file**:
   ```bash
   git add my-custom-catalog.yaml
   ```

3. **Commit with descriptive message**:
   ```bash
   git commit -m "Register [service-name]-mcp server - Add [tool_count] tools"
   ```

4. **Push to MCP_Catalogs repository**:
   ```bash
   git push origin main
   ```

5. **Verify the push succeeded**:
   ```bash
   git log --oneline -3
   ```

**Example: Suno MCP Registration Commit:**
```bash
cd $env:USERPROFILE/.docker/mcp/catalogs
git add my-custom-catalog.yaml
git commit -m "Register suno-mcp server - Add 10 music generation tools"
git push origin main
```

**Recovery Procedure:**
If you need to restore catalogs from backup:
```bash
git clone https://github.com/DoctorBrobotnik/MCP_Catalogs.git
cp MCP_Catalogs/catalogs/*.yaml $env:USERPROFILE/.docker/mcp/
```

**Why Catalogs Are Backed Up:**
- Prevents loss of catalog configuration if local files are corrupted
- Enables version history of all MCP server registrations
- Allows recovery if catalog files need to be restored
- Maintains audit trail of when servers were added/modified
- Enables easy setup on new machines

**Critical Important Notes:**
- ⚠️ **MANDATORY STEP** - Do NOT skip catalog backup, even if MCPs repo will be committed anyway
- ⚠️ **SEPARATE REPOSITORIES** - Catalogs are in MCP_Catalogs repo, MCPs code is in MCPs repo
- ⚠️ **Do NOT commit catalogs to the MCPs repository** - They're Docker configuration files, not project source code
- ✅ **ALWAYS backup first** - Commit catalog changes to MCP_Catalogs BEFORE committing to MCPs
- ✅ **Both repos must be pushed** - Push both MCP_Catalogs and MCPs to GitHub when complete

### Enable MCP Server After Catalog Registration

**After registering the MCP server in the catalog, users MUST enable it before it can be used.**

**Command to Enable:**
```bash
docker mcp server enable [service-name]-mcp
```

**Example for Suno MCP:**
```bash
docker mcp server enable suno-mcp
```

**Verification Steps:**
1. Verify the server is enabled:
   ```bash
   docker mcp server ls
   ```
   Should show `[service-name]-mcp` in the list with status `enabled`

2. If secrets are required, set them before first use:
   ```bash
   docker mcp secret set SUNO_API_KEY="your-actual-api-key"
   ```

3. Restart Claude for the tools to appear

**Important Notes:**
- ❌ **Server will NOT appear** in Claude until it's enabled
- ❌ **Tools will NOT be available** without the enable command
- ✅ **Always enable immediately** after catalog registration
- ✅ **Test the tools** in Claude after enabling to verify they work

**User-Facing Documentation Requirement:**
Every MCP server README MUST include this final setup step:

```markdown
## Setup Instructions

### Step 1: Build the Docker Image
[Build instructions]

### Step 2: Set Required Secrets
[Secret setup instructions]

### Step 3: Register in Custom Catalog
The server has been automatically added to your custom catalog.

### Step 4: Enable the Server
Enable the MCP server to make it available in Claude:
```bash
docker mcp server enable [service-name]-mcp
```

### Step 5: Restart Claude
Restart Claude for the tools to appear.
```

### Git Branching Strategy for MCP Development

**Use feature branches for all new MCP server implementations and significant changes.**

**Branching Model:**
- **main** - Stable, production-ready code. All MCP servers here are tested and deployed.
- **feature/[service-name]-mcp** - Feature branch for new MCP server implementation
- **bugfix/[issue-description]** - Bug fix branches for issues in existing servers
- **docs/[description]** - Documentation-only changes (no code changes)

**Feature Branch Workflow (Recommended for New MCP Servers):**

1. **Create a feature branch** from main:
   ```bash
   git checkout -b feature/[service-name]-mcp
   ```

   Example:
   ```bash
   git checkout -b feature/suno-mcp
   ```

2. **Develop on the feature branch** - All implementation, testing, and documentation happens here

3. **Commit regularly** on the feature branch as you complete each milestone:
   ```bash
   git add [files]
   git commit -m "Add [feature] to [service-name]-mcp"
   ```

4. **Backup catalog changes to MCP_Catalogs repo** (Step 8 of workflow):
   ```bash
   cd $env:USERPROFILE/.docker/mcp/catalogs
   git add my-custom-catalog.yaml
   git commit -m "Register [service-name]-mcp server"
   git push origin main
   ```

5. **Create a comprehensive final commit** on feature branch summarizing all work:
   ```bash
   git commit -m "Complete [service-name] MCP server implementation - [N] tools

   [Detailed message with all changes, testing status, etc.]

   Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

6. **Push feature branch to GitHub**:
   ```bash
   git push origin feature/[service-name]-mcp
   ```

7. **Create a Pull Request** on GitHub:
   - Base branch: `main`
   - Compare branch: `feature/[service-name]-mcp`
   - Title: `Implement [Service Name] MCP server with [N] tools`
   - Description: Include feature list, implementation approach, testing status

8. **Merge to main** after review:
   ```bash
   # On main branch
   git checkout main
   git pull origin main
   git merge --no-ff feature/[service-name]-mcp
   git push origin main
   ```

9. **Delete the feature branch** (cleanup):
   ```bash
   git branch -d feature/[service-name]-mcp
   git push origin --delete feature/[service-name]-mcp
   ```

**Direct Commit Workflow (For Small Updates):**

If making small updates to existing servers or documentation:

1. **Work directly on main** (for small changes only):
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Make changes and commit**:
   ```bash
   git add [files]
   git commit -m "[Description of change]"
   ```

3. **Push to GitHub**:
   ```bash
   git push origin main
   ```

**Branch Naming Conventions:**
- **New MCP servers**: `feature/[service-name]-mcp` (e.g., `feature/suno-mcp`)
- **Bug fixes**: `bugfix/[issue-number]-[description]` (e.g., `bugfix/123-fix-polling-timeout`)
- **Documentation**: `docs/[description]` (e.g., `docs/add-setup-guide`)
- **Refactoring**: `refactor/[description]` (e.g., `refactor/consolidate-validation`)

**When to Use Branches:**
- ✅ **Use feature branch** for: New MCP servers, major features, significant refactoring
- ✅ **Use feature branch** for: Changes that span multiple files or days of work
- ❌ **No branch needed** for: Small typo fixes, single-line documentation updates
- ❌ **No branch needed** for: Minor configuration changes to existing servers

**Branch Protection Rules (Recommended):**
- Require pull request reviews before merge to main
- Require status checks to pass before merge (if CI/CD is configured)
- Require branches to be up to date before merge
- Dismiss stale pull request approvals when new commits are pushed

### Git Workflow for MCP Development

**After completing all implementation, testing, documentation, AND catalog registration:**

1. **Verify git status**:
   ```bash
   git status
   ```
   Should show untracked files in the new `[service-name]-mcp/` directory

2. **Stage all new files**:
   ```bash
   cd [path-to-service-dir]
   git add .
   ```

3. **Create a comprehensive commit** with descriptive message that includes:
   - All features implemented (list tools by tier)
   - Implementation approach (architecture, design patterns)
   - Key technical decisions (async strategy, validation approach)
   - Testing status (code review grade, Docker verification)
   - Any code quality notes

   Example:
   ```bash
   git commit -m "Implement [service-name] MCP server with [N] tools

   FEATURES:
   - [Tier 1]: tool1, tool2, tool3
   - [Tier 2]: tool4, tool5
   - [Tier 3]: tool6, tool7

   IMPLEMENTATION:
   - TypeScript with MCP SDK
   - Polling-based async (no webhooks)
   - Comprehensive parameter validation
   - Docker multi-stage build

   TESTING:
   - Code review: [X/100]
   - Docker build: ✅ Success
   - MCP protocol test: ✅ Verified

   Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

4. **Verify the commit**:
   ```bash
   git log --oneline -5
   git show --stat HEAD
   ```

5. **Push to GitHub** (when ready):
   ```bash
   git push origin main
   ```

### When NOT to Defer Git Workflow

❌ **NEVER** skip git commits because:
- Implementation is not "complete enough"
- You plan to commit later
- Changes will be committed together with other work
- The files aren't "ready"
- Catalog registration hasn't been done yet
- Catalog changes haven't been backed up to MCP_Catalogs repo yet
- Server enable command hasn't been documented yet

✅ **ALWAYS** commit immediately after:
- Code review is complete (and issues are fixed)
- Docker build succeeds
- Testing verifies MCP protocol works
- Documentation is done
- **Catalog registration is complete** (my-custom-catalog.yaml updated)
- **Catalog backup is complete** (pushed to DoctorBrobotnik/MCP_Catalogs repo)
- **Server enable documentation is added** to README with `docker mcp server enable [service-name]-mcp` command

**CRITICAL SEQUENCE REMINDER:**
1. Register in local catalog
2. Commit & push to MCP_Catalogs repo ← **MUST DO THIS FIRST**
3. Then commit & push to MCPs repo

### Commit Message Requirements

Each commit message must include:
- **Summary line** (50 chars max): Clear description of what was implemented
- **Feature list**: Tools by tier with parameter count
- **Implementation details**: Architecture, patterns, design decisions
- **Testing status**: Code review score, Docker build status, protocol tests
- **Co-author line**: `Co-Authored-By: Claude <noreply@anthropic.com>`

### Important Notes

- The `.gitignore` file automatically excludes:
  - `node_modules/`, `build/`, `dist/` directories
  - `.env` files and all secrets
  - IDE files and OS clutter
  - Compiled JavaScript and map files

- **Never commit**:
  - `.env` files or credentials
  - API tokens (use Docker secrets instead)
  - Build artifacts (automatically ignored)
  - node_modules (automatically ignored)

- **Always commit**:
  - Source code (`src/` directory)
  - Configuration files (package.json, tsconfig.json, Dockerfile)
  - Documentation (README.md, planning documents)
  - Test files and examples

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

When creating a new MCP server README, include setup instructions that reflect the GitHub Actions CI/CD workflow:

### Step 1: Pull the Pre-Built Image
Users pull the pre-built image from GitHub Container Registry (no local build needed):

```bash
docker pull ghcr.io/doctorbrobotnik/[service-name]-mcp:latest
```

### Step 2: Add Required Secrets (if needed)
For servers that need API keys, tokens, or credentials:

```bash
docker mcp secret set SECRET_NAME="your-secret-value-here"
```

Document each secret clearly:
- What the secret is for (e.g., "Discord bot token")
- Where to obtain it (e.g., "from Discord Developer Portal")
- How to verify: `docker mcp secret ls`

**Example for Discord:**
```bash
docker mcp secret set DISCORD_TOKEN="your-bot-token-here"
```
Get your token from:
1. Discord Developer Portal → Applications
2. Your application → Bot → TOKEN (Copy)

### Step 3: Register in Custom Catalog
The server entry must be added to the custom catalog at:
`$env:USERPROFILE/.docker/mcp/catalogs/my-custom-catalog.yaml`

**Example catalog entry:**
```yaml
[service-name]-mcp:
  title: Service Name MCP Server
  description: "[Brief description of capabilities]"
  type: server
  source: remote
  image: ghcr.io/doctorbrobotnik/[service-name]-mcp:latest
  tools:
    - name: [service]_[tool1]
    - name: [service]_[tool2]
  secrets:
    - name: [SECRET_NAME]
      env: [SECRET_NAME]
      example: "example-value"
```

### Step 4: Enable the Server
Enable the server to make it available in Claude:

```bash
docker mcp server enable [service-name]-mcp
```

### Step 5: Restart Claude
Restart Claude Desktop for the tools to appear.

---

## Catalog Configuration for CI/CD Images

When registering servers built via GitHub Actions, use the remote GHCR image URL in the catalog:

```yaml
[service-name]-mcp:
  title: Service Name MCP Server
  image: ghcr.io/doctorbrobotnik/[service-name]-mcp:latest
  source: remote
  # ... other config
```

**Key differences from local builds:**
- **source**: Set to `remote` (not `local`)
- **image**: Use full GHCR URL: `ghcr.io/doctorbrobotnik/[service-name]-mcp:latest`
- **automatic updates**: Images update when code is pushed to the repository
- **no local build needed**: Docker pulls the pre-built image directly
