#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

// Import all tools
import { sendMessage } from './tools/discord_send_message.js';
import { readMessages } from './tools/discord_read_messages.js';
import { listChannels } from './tools/discord_list_channels.js';
import { listServers } from './tools/discord_list_servers.js';
import { searchMessages } from './tools/discord_search_messages.js';

// Load environment variables
dotenv.config();

// Validate Discord token
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
if (!DISCORD_TOKEN) {
  console.error('Error: DISCORD_TOKEN environment variable is not set');
  process.exit(1);
}

// Register all tools
const tools = [
  sendMessage,
  readMessages,
  listChannels,
  listServers,
  searchMessages,
];

// Create MCP server
const server = new Server(
  {
    name: 'discord-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Create and connect a Discord client on-demand
 * Returns a connected client that should be destroyed after use
 */
async function createDiscordClient(): Promise<Client> {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  // Login and wait for ready
  await client.login(DISCORD_TOKEN);

  // Wait for the client to be ready
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Discord client connection timeout'));
    }, 10000);

    client.once('ready', () => {
      clearTimeout(timeout);
      console.error(`✅ Discord bot connected as ${client.user?.tag}`);
      resolve();
    });

    client.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });

  return client;
}

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map(tool => {
      // Convert Zod schema to JSON Schema manually
      const shape: Record<string, any> = tool.schema.shape;
      const properties: Record<string, any> = {};
      const required: string[] = [];

      // Build proper JSON Schema from Zod schema
      for (const [key, zodType] of Object.entries(shape)) {
        const zodDef = (zodType as any)._def;

        // Handle optional fields
        if (zodDef.typeName === 'ZodOptional') {
          const innerDef = zodDef.innerType._def;
          properties[key] = {
            type: innerDef.typeName === 'ZodNumber' ? 'number' : 'string',
            description: zodDef.description || innerDef.description || ''
          };
        } else if (zodDef.typeName === 'ZodDefault') {
          // Handle default values
          const innerDef = zodDef.innerType._def;
          properties[key] = {
            type: innerDef.typeName === 'ZodNumber' ? 'number' : 'string',
            description: zodDef.description || innerDef.description || ''
          };
          if (innerDef.checks) {
            const minCheck = innerDef.checks.find((c: any) => c.kind === 'min');
            const maxCheck = innerDef.checks.find((c: any) => c.kind === 'max');
            if (minCheck) properties[key].minimum = minCheck.value;
            if (maxCheck) properties[key].maximum = maxCheck.value;
          }
        } else {
          // Required field
          properties[key] = {
            type: zodDef.typeName === 'ZodNumber' ? 'number' : 'string',
            description: zodDef.description || ''
          };
          required.push(key);
        }
      }

      return {
        name: tool.name,
        description: tool.description,
        inputSchema: {
          type: 'object' as const,
          properties,
          required,
        },
      };
    }),
  };
});

// Handle call tool request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  const tool = tools.find(t => t.name === toolName);

  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  let client: Client | null = null;

  try {
    // Create Discord client on-demand
    console.error(`🔌 Connecting to Discord for ${toolName}...`);
    client = await createDiscordClient();

    // Execute the tool
    const result = await tool.handler(client, request.params.arguments || {});

    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error executing ${toolName}:`, errorMessage);
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  } finally {
    // Always disconnect after the operation
    if (client) {
      console.error(`🔌 Disconnecting from Discord...`);
      await client.destroy();
    }
  }
});

// Start MCP server immediately (no Discord connection needed)
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 MCP server started (stateless mode - connects to Discord on-demand)');
}

main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
