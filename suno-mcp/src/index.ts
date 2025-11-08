import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Import all tools
import { suno_generate_music } from './tools/suno_generate_music.js';
import { suno_get_generation_status } from './tools/suno_get_generation_status.js';
import { suno_check_credits } from './tools/suno_check_credits.js';
import { suno_separate_vocals } from './tools/suno_separate_vocals.js';
import { suno_extend_music } from './tools/suno_extend_music.js';
import { suno_convert_to_wav } from './tools/suno_convert_to_wav.js';
import { suno_generate_lyrics } from './tools/suno_generate_lyrics.js';
import { suno_create_music_video } from './tools/suno_create_music_video.js';
import { suno_add_vocals } from './tools/suno_add_vocals.js';
import { suno_add_instrumental } from './tools/suno_add_instrumental.js';

/**
 * Environment validation at startup
 */
function validateEnvironment(): void {
  if (!process.env.SUNO_API_KEY) {
    console.error('[FATAL] SUNO_API_KEY environment variable not set');
    process.exit(1);
  }
}

/**
 * Initialize MCP server with Suno tools
 */
const server = new Server(
  {
    name: 'suno-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Handle tool listing
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'suno_generate_music',
        description: 'Generate AI music from text descriptions with 14 customizable parameters (custom mode, instrumental, model, prompt, style, title, etc.)',
        inputSchema: {
          type: 'object' as const,
          properties: {
            custom_mode: { type: 'boolean', description: 'Enable custom settings (true) or auto-mode (false)' },
            instrumental: { type: 'boolean', description: 'Generate instrumental-only music' },
            model: { type: 'string', enum: ['V3_5', 'V4', 'V4_5', 'V4_5PLUS', 'V5'], description: 'AI model version' },
            prompt: { type: 'string', description: 'Text description or lyrics (500-3000 chars depending on mode)' },
            style: { type: 'string', description: 'Music style/genre (200-1000 chars)' },
            title: { type: 'string', description: 'Song title (max 80 chars)' },
            persona_id: { type: 'string', description: 'Optional persona ID for style consistency' },
            negative_tags: { type: 'string', description: 'Styles/traits to exclude' },
            vocal_gender: { type: 'string', enum: ['m', 'f'], description: 'Male or female vocals' },
            style_weight: { type: 'number', description: 'Style influence (0.00-1.00)' },
            weirdness_constraint: { type: 'number', description: 'Weirdness factor (0.00-1.00)' },
            audio_weight: { type: 'number', description: 'Audio influence (0.00-1.00)' },
            wait_for_completion: { type: 'boolean', description: 'Wait for generation to complete (default: true)' },
          },
          required: ['custom_mode', 'instrumental', 'model']
        }
      },
      {
        name: 'suno_get_generation_status',
        description: 'Check the status of a music generation task by task ID',
        inputSchema: {
          type: 'object' as const,
          properties: {
            task_id: { type: 'string', description: 'Task ID from any generation endpoint' }
          },
          required: ['task_id']
        }
      },
      {
        name: 'suno_check_credits',
        description: 'Check your account credit balance',
        inputSchema: {
          type: 'object' as const,
          properties: {}
        }
      },
      {
        name: 'suno_separate_vocals',
        description: 'Separate vocals from music or split into stems (1-5 credits)',
        inputSchema: {
          type: 'object' as const,
          properties: {
            task_id: { type: 'string', description: 'Original music generation task ID' },
            audio_id: { type: 'string', description: 'Specific audio track ID to separate' },
            separation_type: { type: 'string', enum: ['separate_vocal', 'split_stem'], description: 'Type of separation' },
            wait_for_completion: { type: 'boolean', description: 'Wait for completion (default: true)' }
          },
          required: ['task_id', 'audio_id']
        }
      },
      {
        name: 'suno_extend_music',
        description: 'Extend an existing music track with 14 parameters',
        inputSchema: {
          type: 'object' as const,
          properties: {
            default_param_flag: { type: 'boolean', description: 'Use custom (true) or original track parameters (false)' },
            audio_id: { type: 'string', description: 'Audio track to extend' },
            model: { type: 'string', enum: ['V3_5', 'V4', 'V4_5', 'V4_5PLUS', 'V5'], description: 'Must match source audio model' },
            prompt: { type: 'string', description: 'Extension description (max 3000 chars)' },
            style: { type: 'string', description: 'Music style (max 200 chars)' },
            title: { type: 'string', description: 'Track title (max 80 chars)' },
            continue_at: { type: 'number', description: 'Start time in seconds' },
            persona_id: { type: 'string', description: 'Optional persona ID' },
            negative_tags: { type: 'string', description: 'Styles to exclude' },
            vocal_gender: { type: 'string', enum: ['m', 'f'], description: 'Vocal gender' },
            style_weight: { type: 'number', description: 'Style influence (0.00-1.00)' },
            weirdness_constraint: { type: 'number', description: 'Weirdness factor (0.00-1.00)' },
            audio_weight: { type: 'number', description: 'Audio influence (0.00-1.00)' },
            wait_for_completion: { type: 'boolean', description: 'Wait for completion (default: true)' }
          },
          required: ['default_param_flag', 'audio_id', 'model']
        }
      },
      {
        name: 'suno_convert_to_wav',
        description: 'Convert generated music to WAV format',
        inputSchema: {
          type: 'object' as const,
          properties: {
            task_id: { type: 'string', description: 'Music generation task ID' },
            audio_id: { type: 'string', description: 'Specific track to convert' },
            wait_for_completion: { type: 'boolean', description: 'Wait for completion (default: true)' }
          },
          required: ['task_id', 'audio_id']
        }
      },
      {
        name: 'suno_generate_lyrics',
        description: 'Generate lyrics from a theme or description',
        inputSchema: {
          type: 'object' as const,
          properties: {
            prompt: { type: 'string', description: 'Theme/description (max 200 words)' },
            wait_for_completion: { type: 'boolean', description: 'Wait for completion (default: true)' }
          },
          required: ['prompt']
        }
      },
      {
        name: 'suno_create_music_video',
        description: 'Create a music video from generated audio',
        inputSchema: {
          type: 'object' as const,
          properties: {
            task_id: { type: 'string', description: 'Music generation task ID' },
            audio_id: { type: 'string', description: 'Track to create video for' },
            author: { type: 'string', description: 'Artist/creator name in video (max 50 chars)' },
            domain_name: { type: 'string', description: 'Website/brand watermark (max 50 chars)' },
            wait_for_completion: { type: 'boolean', description: 'Wait for completion (default: false - videos are slow)' }
          },
          required: ['task_id', 'audio_id']
        }
      },
      {
        name: 'suno_add_vocals',
        description: 'Add vocals to an instrumental track (11 parameters)',
        inputSchema: {
          type: 'object' as const,
          properties: {
            prompt: { type: 'string', description: 'Vocal content/style description' },
            title: { type: 'string', description: 'Track title' },
            negative_tags: { type: 'string', description: 'Vocal styles to exclude' },
            style: { type: 'string', description: 'Music and vocal style' },
            upload_url: { type: 'string', description: 'Publicly accessible instrumental audio URL' },
            vocal_gender: { type: 'string', enum: ['m', 'f'], description: 'Vocal gender' },
            style_weight: { type: 'number', description: 'Style influence (0.00-1.00)' },
            weirdness_constraint: { type: 'number', description: 'Weirdness factor (0.00-1.00)' },
            audio_weight: { type: 'number', description: 'Audio influence (0.00-1.00)' },
            model: { type: 'string', enum: ['V4_5PLUS', 'V5'], description: 'Model version (default: V4_5PLUS)' },
            wait_for_completion: { type: 'boolean', description: 'Wait for completion (default: true)' }
          },
          required: ['prompt', 'title', 'negative_tags', 'style', 'upload_url']
        }
      },
      {
        name: 'suno_add_instrumental',
        description: 'Add instrumental backing to a vocal track (10 parameters)',
        inputSchema: {
          type: 'object' as const,
          properties: {
            upload_url: { type: 'string', description: 'Publicly accessible vocal audio URL' },
            title: { type: 'string', description: 'Track title' },
            negative_tags: { type: 'string', description: 'Styles/instruments to exclude' },
            tags: { type: 'string', description: 'Desired instrumental characteristics' },
            vocal_gender: { type: 'string', enum: ['m', 'f'], description: 'Vocal gender' },
            style_weight: { type: 'number', description: 'Style influence (0.00-1.00)' },
            weirdness_constraint: { type: 'number', description: 'Weirdness factor (0.00-1.00)' },
            audio_weight: { type: 'number', description: 'Audio influence (0.00-1.00)' },
            model: { type: 'string', enum: ['V4_5PLUS', 'V5'], description: 'Model version (default: V4_5PLUS)' },
            wait_for_completion: { type: 'boolean', description: 'Wait for completion (default: true)' }
          },
          required: ['upload_url', 'title', 'negative_tags', 'tags']
        }
      }
    ]
  };
});

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;

    switch (name) {
      case 'suno_generate_music':
        result = await suno_generate_music(args as any);
        break;
      case 'suno_get_generation_status':
        result = await suno_get_generation_status(args as any);
        break;
      case 'suno_check_credits':
        result = await suno_check_credits();
        break;
      case 'suno_separate_vocals':
        result = await suno_separate_vocals(args as any);
        break;
      case 'suno_extend_music':
        result = await suno_extend_music(args as any);
        break;
      case 'suno_convert_to_wav':
        result = await suno_convert_to_wav(args as any);
        break;
      case 'suno_generate_lyrics':
        result = await suno_generate_lyrics(args as any);
        break;
      case 'suno_create_music_video':
        result = await suno_create_music_video(args as any);
        break;
      case 'suno_add_vocals':
        result = await suno_add_vocals(args as any);
        break;
      case 'suno_add_instrumental':
        result = await suno_add_instrumental(args as any);
        break;
      default:
        return {
          content: [
            {
              type: 'text',
              text: `❌ Unknown tool: ${name}`
            }
          ]
        };
    }

    return result;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error calling tool ${name}:`, error);
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error: ${error instanceof Error ? error.message : String(error)}`
        }
      ]
    };
  }
});

/**
 * Main entry point with environment validation
 */
async function main() {
  console.error(`[${new Date().toISOString()}] Starting Suno MCP server...`);

  // Validate environment before connecting
  validateEnvironment();

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`[${new Date().toISOString()}] Suno MCP server running on stdio`);
}

main().catch((error) => {
  console.error(`[${new Date().toISOString()}] Fatal error:`, error);
  process.exit(1);
});
