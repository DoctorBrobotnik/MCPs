# MCP SERVER GENERATION TEMPLATE

This template guides LLMs in generating complete, working MCP servers for this repository.

---

## BEFORE YOU START

**For all best practices, conventions, and detailed guidance, refer to CLAUDE.md in this repository:**
- Tool naming conventions
- Docker requirements and configuration
- File organization standards
- Platform-specific command syntax
- Pre-build verification checklist
- Common implementation patterns
- Error handling standards
- Security best practices

This template focuses on FILE GENERATION. For everything else, use CLAUDE.md as your authoritative reference.

---

## INITIAL CLARIFICATIONS

Before generating the MCP server, ask the user to provide:

1. **Service/Tool Name**: What service or functionality will this MCP server provide?
2. **API Documentation**: If this integrates with an API, provide the documentation URL
3. **Required Features**: List the specific features/tools you want implemented
4. **Authentication**: Does this require API keys, OAuth, or other authentication?
5. **Data Sources**: Will this access files, databases, APIs, or other data sources?

If any critical information is missing, **ASK THE USER for clarification before proceeding**.

---

## INSTRUCTIONS FOR THE LLM

### YOUR ROLE

You are an expert MCP (Model Context Protocol) server developer. Create a complete, working MCP server based on the user's requirements using this template.

### CLARIFICATION CHECKLIST

Before generating, ensure you have:
- Service name and clear description
- API documentation (if external integration)
- Specific list of tools/functions needed
- Authentication requirements
- Any specific output/formatting preferences

### CRITICAL REFERENCE

**Read CLAUDE.md first for:**
- CRITICAL RULES FOR CODE GENERATION (tool naming, file naming, docstrings, parameters, etc.)
- DEFAULT LANGUAGE: TypeScript is preferred unless user specifies otherwise
- IMPLEMENTATION PATTERNS: Common patterns for tools, API integration, error handling
- OUTPUT FORMATTING: Emoji usage, response structure
- DOCKER CONFIGURATION: Base images, user creation, environment variables
- MCP SDK DOCUMENTATION: https://modelcontextprotocol.io/docs/sdk

**Key Points to Remember:**
- All tool names MUST follow format: `[service_name]_[tool_name]` (lowercase, underscores)
- SINGLE-LINE docstrings ONLY (multi-line causes gateway panic)
- ALL parameters default to empty strings: `param: str = ""`
- All tools return strings (formatted responses)
- No `@mcp.prompt()` decorators
- No `prompt` parameter to FastMCP()
- Use UID >5000 for Docker user (e.g., 9001)
- STATELESS design only (connect on-demand, close immediately)

### OUTPUT STRUCTURE

Organize your response in TWO sections:

**SECTION 1: FILES TO CREATE**
- Generate complete file content users can copy and save
- Include Dockerfile, package.json/requirements.txt, main server file, README.md
- Each file appears ONCE with complete content

**SECTION 2: INSTALLATION INSTRUCTIONS FOR THE USER**
- Step-by-step commands for users to run
- Platform-specific syntax where applicable
- Clear, numbered list format

---

# SECTION 1: FILES TO CREATE

## For TypeScript Projects (Recommended)

Use this structure unless user explicitly requests Python.

### File 1: Dockerfile (TypeScript)

```dockerfile
# Multi-stage build for TypeScript
FROM node:18-slim AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src/ src/
COPY tsconfig.json .

# Build TypeScript
RUN npm run build


# Production stage
FROM node:18-slim

WORKDIR /app

ENV NODE_ENV=production

# Copy only necessary files from builder
COPY --from=builder /app/dist dist/
COPY --from=builder /app/node_modules node_modules/
COPY package.json .

# Create non-root user with unique UID (>5000 recommended)
RUN useradd -m -u 9001 mcpuser && \
    chown -R mcpuser:mcpuser /app

USER mcpuser

CMD ["node", "dist/index.js"]
```

### File 2: package.json (TypeScript)

```json
{
  "name": "[server-name]-mcp",
  "version": "1.0.0",
  "description": "[DESCRIPTION]",
  "main": "dist/index.js",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx src/index.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "tsx": "^4.0.0"
  }
}
```

### File 3: tsconfig.json (TypeScript)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020"],
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### File 4: src/index.ts (TypeScript Server)

```typescript
#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server({
  name: "[SERVICE_NAME]",
  version: "1.0.0",
});

// Define tools - see CLAUDE.md for tool naming and implementation patterns
const tools = [
  {
    name: "[service_name]_example_tool",
    description: "Single-line description of what this tool does",
    inputSchema: {
      type: "object" as const,
      properties: {
        param: {
          type: "string",
          description: "Description of the parameter",
        },
      },
      required: [],
    },
  },
];

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: tools,
}));

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request;
  const param = (args as { param?: string }).param || "";

  if (name === "[service_name]_example_tool") {
    try {
      if (!param.trim()) {
        return {
          content: [
            {
              type: "text",
              text: "❌ Error: param is required",
            },
          ],
        };
      }

      // Implementation here
      const result = "success";
      return {
        content: [
          {
            type: "text",
            text: `✅ Success: ${result}`,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `❌ Error: ${message}`,
          },
        ],
      };
    }
  }

  return {
    content: [
      {
        type: "text",
        text: `❌ Unknown tool: ${name}`,
      },
    ],
  };
});

// Server startup
async function main() {
  console.error("[SERVICE_NAME] MCP server starting...");
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[SERVICE_NAME] MCP server connected");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
```

---

## For Python Projects

Use this structure only if user explicitly requests Python.

### File 1: Dockerfile (Python)

```dockerfile
# Use Python slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set Python unbuffered mode
ENV PYTHONUNBUFFERED=1

# Copy requirements first for better caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the server code
COPY [SERVER_NAME]_server.py .

# Create non-root user with unique UID (>5000 recommended)
RUN useradd -m -u 9001 mcpuser && \
    chown -R mcpuser:mcpuser /app

# Switch to non-root user
USER mcpuser

# Run the server
CMD ["python", "[SERVER_NAME]_server.py"]
```

### File 2: requirements.txt (Python)

```
mcp[cli]>=1.2.0
httpx
# Add any other required libraries based on the user's needs
```

### File 3: [SERVER_NAME]_server.py (Python Server)

```python
#!/usr/bin/env python3
"""
[SERVICE_NAME] MCP Server - [DESCRIPTION]

For implementation patterns and best practices, see CLAUDE.md
"""

import os
import sys
import logging
from datetime import datetime, timezone
import httpx
from mcp.server.fastmcp import FastMCP

# Configure logging to stderr
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger("[SERVER_NAME]-server")

# Initialize MCP server - NO PROMPT PARAMETER!
mcp = FastMCP("[SERVER_NAME]")

# Configuration
# Add any API keys, URLs, or configuration here
# API_TOKEN = os.environ.get("[SERVER_NAME_UPPER]_API_TOKEN", "")

# === MCP TOOLS ===
# See CLAUDE.md for tool naming convention: [service_name]_[tool_name]
# Requirements:
# - Use @mcp.tool() decorator
# - SINGLE-LINE docstrings only
# - Use empty string defaults (param: str = "") NOT None
# - Return formatted strings
# - Include proper error handling

@mcp.tool()
async def service_example_tool(param: str = "") -> str:
    """Single-line description of what this tool does - MUST BE ONE LINE."""
    logger.info(f"Executing service_example_tool with {param}")

    try:
        # Implementation here
        result = "example"
        return f"✅ Success: {result}"
    except Exception as e:
        logger.error(f"Error: {e}")
        return f"❌ Error: {str(e)}"

# === SERVER STARTUP ===
if __name__ == "__main__":
    logger.info("Starting [SERVICE_NAME] MCP server...")

    # Add any startup checks
    # if not API_TOKEN:
    #     logger.warning("[SERVER_NAME_UPPER]_API_TOKEN not set")

    try:
        mcp.run(transport='stdio')
    except Exception as e:
        logger.error(f"Server error: {e}", exc_info=True)
        sys.exit(1)
```

---

### File 4: README.md (Both Python and TypeScript)

**IMPORTANT**: Use the `docs-guide-writer` agent to create the README.md file.

**DO NOT create a manual README.md.** Instead:

1. After generating all other files, invoke the docs-guide-writer agent:
   ```
   Use the Task tool with subagent_type: "docs-guide-writer"
   ```

2. Provide the agent with:
   - MCP server name and description
   - List of all tools created (name and brief description)
   - Language used (TypeScript or Python)
   - Any special features or authentication requirements

3. The agent will generate a comprehensive, well-structured README.md including:
   - Service description and purpose
   - Complete feature list with all tools
   - Prerequisites and installation steps
   - Detailed usage examples
   - Architecture diagram
   - Development guidelines
   - Troubleshooting section
   - Security considerations
   - License information

**Example prompt for docs-guide-writer:**
```
Create a comprehensive README.md for [SERVICE_NAME] MCP server that provides these tools:
- [tool_name_1]: [description]
- [tool_name_2]: [description]

Built in TypeScript using the MCP SDK. Include installation steps, usage examples, and troubleshooting.
```

**Reference**: See CLAUDE.md section "Creating Documentation with docs-guide-writer Agent" for complete guidance.

### File 5: .gitignore

```
# Dependencies
node_modules/
__pycache__/
*.pyc
pip-log.txt
pip-delete-this-directory.txt

# Build artifacts
dist/
build/
*.egg-info/
.eggs/

# Environment
.env
.env.local
.venv
venv/

# IDE
.vscode/
.idea/
*.swp
*.swo
*.sublime-project
*.sublime-workspace

# OS
.DS_Store
Thumbs.db

# Build outputs
*.js
*.js.map
```

---

# SECTION 2: INSTALLATION INSTRUCTIONS FOR THE USER

After creating the files above, provide these step-by-step instructions:

## Step 1: Save the Files

**PowerShell (Windows):**
```powershell
mkdir "[SERVER_NAME]-mcp"
cd "[SERVER_NAME]-mcp"
# Save all files in this directory
```

**Bash/WSL/Git Bash:**
```bash
mkdir -p ~/Repos/Personal/MCPs/[server-name]-mcp
cd ~/Repos/Personal/MCPs/[server-name]-mcp
# Save all files in this directory
```

---

## Step 2: Build Docker Image

**PowerShell (Windows):**
```powershell
docker build -t [server-name]-mcp .
```

**Bash/WSL/Git Bash:**
```bash
docker build -t [server-name]-mcp .
```

### Verify the Build

Check the image was created successfully:
```powershell
docker images [server-name]-mcp
```

You should see your image listed with a recent creation timestamp. If the build failed, check the error output above.

---

## Step 3: Set Up Secrets (if needed)

If your server requires API keys or secrets:

```powershell
docker mcp secret set SECRET_NAME="your-secret-value"
```

Verify secrets were created:
```powershell
docker mcp secret ls
```

---

## Step 4: Update Custom Catalog

Create or edit the custom catalog file:

**PowerShell (Windows):**
```powershell
code "$env:USERPROFILE\.docker\mcp\catalogs\my-custom-catalog.yaml"
```

**Bash/WSL/Git Bash:**
```bash
code ~/.docker/mcp/catalogs/my-custom-catalog.yaml
```

Add this entry to the catalog (replace placeholders):

```yaml
version: 2
name: custom
displayName: Custom MCP Servers
registry:
  [server-name]:
    title: "[SERVICE_NAME]"
    description: "[DESCRIPTION]"
    image: [server-name]-mcp:latest
    tools:
      - name: [tool_name_1]
      - name: [tool_name_2]
    secrets:
      - name: [SECRET_NAME]
        env: [ENV_VAR_NAME]
        example: "[example-value]"
```

**Important**: Only include the `secrets` section if your server requires them.

---

## Step 5: Restart Claude

1. Quit Claude completely
2. Start Claude again
3. Your new tools should appear in the tools list

---

## Step 6: Test Your Server

Verify the server is running:
```powershell
docker mcp server list
```

If tools don't appear:
- Check catalog file syntax (YAML must be valid)
- Verify secrets are set correctly
- Check Docker build output for errors
- Restart Claude

---

## Platform-Specific Syntax Notes

**For all shell-specific syntax and detailed command examples, see CLAUDE.md section "Platform-Specific Command Syntax"**

**Key points:**
- **Windows PowerShell**: Use `$env:USERPROFILE`, forward slashes in Docker commands
- **Bash/WSL/Git Bash**: Use `~` or `$HOME`, forward slashes in all paths

---

## For More Information

Refer to CLAUDE.md for:
- Pre-build verification checklist
- Git workflow and version control
- Common issues and troubleshooting
- Security best practices
- Development guidelines
- Building and testing procedures
