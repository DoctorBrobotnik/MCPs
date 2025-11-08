# Suno MCP Server Implementation Plan

## Overview
Build a TypeScript-based MCP server for Suno AI music generation API with 10 tools (Tiers 1-3), using polling-based async handling (no webhooks), complete parameter support, and Docker deployment.

## Project Structure
```
$env:USERPROFILE\Repos\Personal\MCPs\suno-mcp\
├── src/
│   ├── index.ts                           # Main MCP server
│   ├── tools/
│   │   ├── suno_generate_music.ts         # Tier 1: Music generation (14 params)
│   │   ├── suno_get_generation_status.ts  # Tier 1: Status checking
│   │   ├── suno_check_credits.ts          # Tier 1: Credit balance
│   │   ├── suno_separate_vocals.ts        # Tier 2: Vocal/stem separation
│   │   ├── suno_extend_music.ts           # Tier 2: Extend tracks (14 params)
│   │   ├── suno_convert_to_wav.ts         # Tier 2: WAV conversion
│   │   ├── suno_generate_lyrics.ts        # Tier 3: Lyrics generation
│   │   ├── suno_create_music_video.ts     # Tier 3: Video generation
│   │   ├── suno_add_vocals.ts             # Tier 3: Vocal layering (11 params)
│   │   └── suno_add_instrumental.ts       # Tier 3: Backing music (10 params)
│   ├── utils/
│   │   ├── suno-client.ts                 # API client wrapper
│   │   └── async-handler.ts               # Polling logic with smart intervals
│   └── types/
│       └── suno-api.ts                    # TypeScript type definitions
├── Dockerfile                             # Multi-stage build
├── package.json                           # Dependencies & scripts
├── tsconfig.json                          # TypeScript config
├── README.md                              # Setup & usage guide
└── .gitignore                             # Exclude build artifacts
```

## Complete Parameter Specifications

### TIER 1 Tools

**`suno_generate_music` (14 parameters):**
- `custom_mode`: boolean (required) - Enable custom settings
- `instrumental`: boolean (required) - Generate instrumental-only music
- `model`: string (required) - "V3_5" | "V4" | "V4_5" | "V4_5PLUS" | "V5"
- `prompt`: string (conditional) - Text description/lyrics (500-5000 chars based on mode/model)
- `style`: string (conditional) - Music style/genre (200-1000 chars based on model)
- `title`: string (conditional) - Song title (80 chars max)
- `persona_id`: string (optional) - Persona ID for style consistency
- `negative_tags`: string (optional) - Styles/traits to exclude
- `vocal_gender`: string (optional) - "m" (male) | "f" (female)
- `style_weight`: number (optional) - 0.00-1.00 (multiples of 0.01)
- `weirdness_constraint`: number (optional) - 0.00-1.00 (multiples of 0.01)
- `audio_weight`: number (optional) - 0.00-1.00 (multiples of 0.01)
- `wait_for_completion`: boolean (optional, default: true) - Poll until complete or timeout

**Parameter Logic:**
- If `custom_mode=true` AND `instrumental=true`: REQUIRE `style`, `title`
- If `custom_mode=true` AND `instrumental=false`: REQUIRE `style`, `title`, `prompt`
- If `custom_mode=false`: REQUIRE `prompt` only (auto-generates style/title/lyrics)

**`suno_get_generation_status` (1 parameter):**
- `task_id`: string (required) - Task ID from any generation endpoint

**`suno_check_credits` (0 parameters):**
- Returns integer credit balance

### TIER 2 Tools

**`suno_separate_vocals` (4 parameters):**
- `task_id`: string (required) - Original music generation task ID
- `audio_id`: string (required) - Specific audio track ID
- `separation_type`: string (optional, default: "separate_vocal") - "separate_vocal" (2 stems, 1 credit) | "split_stem" (12 stems, 5 credits)
- `wait_for_completion`: boolean (optional, default: true)

**`suno_extend_music` (14 parameters):**
- `default_param_flag`: boolean (required) - Use custom parameters (true) or original track params (false)
- `audio_id`: string (required) - Audio track to extend
- `model`: string (required) - Must match source audio model
- `prompt`: string (conditional) - Extension description (3000 chars max)
- `style`: string (conditional) - Music style (200 chars max)
- `title`: string (conditional) - Track title (80 chars max)
- `continue_at`: number (conditional) - Start time in seconds (> 0 and < track duration)
- `persona_id`: string (optional)
- `negative_tags`: string (optional)
- `vocal_gender`: string (optional)
- `style_weight`: number (optional)
- `weirdness_constraint`: number (optional)
- `audio_weight`: number (optional)
- `wait_for_completion`: boolean (optional, default: true)

**`suno_convert_to_wav` (3 parameters):**
- `task_id`: string (required) - Music generation task ID
- `audio_id`: string (required) - Specific track to convert
- `wait_for_completion`: boolean (optional, default: true)

### TIER 3 Tools

**`suno_generate_lyrics` (2 parameters):**
- `prompt`: string (required) - Theme/description (200 words max)
- `wait_for_completion`: boolean (optional, default: true)

**`suno_create_music_video` (5 parameters):**
- `task_id`: string (required) - Music generation task ID
- `audio_id`: string (required) - Specific track to create video for
- `author`: string (optional) - Artist/creator name in video (50 chars max)
- `domain_name`: string (optional) - Website/brand watermark (50 chars max)
- `wait_for_completion`: boolean (optional, default: false) - Videos are slow, default to returning task_id

**`suno_add_vocals` (11 parameters):**
- `prompt`: string (required) - Vocal content/style description
- `title`: string (required) - Track title
- `negative_tags`: string (required) - Vocal styles to exclude
- `style`: string (required) - Music and vocal style
- `upload_url`: string (required) - Publicly accessible instrumental audio URL
- `vocal_gender`: string (optional) - "m" | "f"
- `style_weight`: number (optional) - 0.00-1.00
- `weirdness_constraint`: number (optional) - 0.00-1.00
- `audio_weight`: number (optional) - 0.00-1.00
- `model`: string (optional, default: "V4_5PLUS") - "V4_5PLUS" | "V5"
- `wait_for_completion`: boolean (optional, default: true)

**`suno_add_instrumental` (10 parameters):**
- `upload_url`: string (required) - Publicly accessible vocal audio URL
- `title`: string (required) - Track title
- `negative_tags`: string (required) - Styles/instruments to exclude
- `tags`: string (required) - Desired instrumental characteristics
- `vocal_gender`: string (optional)
- `style_weight`: number (optional)
- `weirdness_constraint`: number (optional)
- `audio_weight`: number (optional)
- `model`: string (optional, default: "V4_5PLUS")
- `wait_for_completion`: boolean (optional, default: true)

## Implementation Steps

### 1. Project Scaffolding
Create directory structure and initialize project:
```powershell
mkdir "$env:USERPROFILE\Repos\Personal\MCPs\suno-mcp"
cd "$env:USERPROFILE\Repos\Personal\MCPs\suno-mcp"
```

**`package.json`:**
```json
{
  "name": "suno-mcp",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.0.0"
  },
  "scripts": {
    "build": "tsc",
    "start": "node build/index.js"
  }
}
```

**`tsconfig.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "outDir": "./build",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build"]
}
```

**`.gitignore`:**
```
node_modules/
build/
dist/
*.js
*.js.map
.env
.DS_Store
```

### 2. Type Definitions (`src/types/suno-api.ts`)
Define complete TypeScript interfaces:
```typescript
export type ModelVersion = "V3_5" | "V4" | "V4_5" | "V4_5PLUS" | "V5";
export type VocalGender = "m" | "f";
export type SeparationType = "separate_vocal" | "split_stem";
export type TaskStatus = "PENDING" | "TEXT_SUCCESS" | "FIRST_SUCCESS" | "SUCCESS" | "CREATE_TASK_FAILED" | "GENERATE_AUDIO_FAILED";

export interface GenerateMusicRequest {
  customMode: boolean;
  instrumental: boolean;
  model: ModelVersion;
  prompt?: string;
  style?: string;
  title?: string;
  personaId?: string;
  negativeTags?: string;
  vocalGender?: VocalGender;
  styleWeight?: number;
  weirdnessConstraint?: number;
  audioWeight?: number;
}

export interface ExtendMusicRequest {
  defaultParamFlag: boolean;
  audioId: string;
  model: ModelVersion;
  prompt?: string;
  style?: string;
  title?: string;
  continueAt?: number;
  personaId?: string;
  negativeTags?: string;
  vocalGender?: VocalGender;
  styleWeight?: number;
  weirdnessConstraint?: number;
  audioWeight?: number;
}

export interface SunoResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export interface TaskResponse {
  taskId: string;
}

export interface GenerationStatusData {
  taskId: string;
  status: TaskStatus;
  response?: {
    sunoData: Array<{
      id: string;
      audioUrl: string;
      streamAudioUrl: string;
      imageUrl: string;
      title: string;
      tags: string;
      duration: number;
    }>;
  };
  errorMessage?: string;
}
```

### 3. API Client (`src/utils/suno-client.ts`)
Axios-based client with Bearer auth and error handling:
```typescript
import axios, { AxiosInstance } from 'axios';
import type { GenerateMusicRequest, SunoResponse, TaskResponse, GenerationStatusData } from '../types/suno-api.js';

export class SunoClient {
  private client: AxiosInstance;
  private dummyCallbackUrl = "https://example.com/webhook"; // Placeholder since we poll instead

  constructor(apiKey: string) {
    this.client = axios.create({
      baseURL: 'https://api.sunoapi.org',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  async generateMusic(params: GenerateMusicRequest): Promise<SunoResponse<TaskResponse>> {
    const response = await this.client.post('/api/v1/generate', {
      ...params,
      callBackUrl: this.dummyCallbackUrl
    });
    return response.data;
  }

  async getGenerationStatus(taskId: string): Promise<SunoResponse<GenerationStatusData>> {
    const response = await this.client.get('/api/v1/generate/record-info', {
      params: { taskId }
    });
    return response.data;
  }

  async checkCredits(): Promise<SunoResponse<number>> {
    const response = await this.client.get('/api/v1/generate/credit');
    return response.data;
  }

  // ... similar methods for all 10 endpoints
}
```

### 4. Async Handler (`src/utils/async-handler.ts`)
Smart polling with exponential backoff:
```typescript
import type { SunoClient } from './suno-client.js';
import type { GenerationStatusData } from '../types/suno-api.js';

export async function pollTaskUntilComplete(
  client: SunoClient,
  taskId: string,
  maxWaitSeconds: number = 60,
  initialIntervalMs: number = 2000
): Promise<GenerationStatusData | { taskId: string; status: string }> {
  const startTime = Date.now();
  let intervalMs = initialIntervalMs;

  while (Date.now() - startTime < maxWaitSeconds * 1000) {
    const result = await client.getGenerationStatus(taskId);

    if (result.data.status === 'SUCCESS' || result.data.status.includes('FAILED')) {
      return result.data;
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs));
    intervalMs = Math.min(intervalMs * 1.2, 5000); // Max 5s interval
  }

  // Timeout - return task_id for manual checking
  return { taskId, status: 'POLLING_TIMEOUT' };
}
```

### 5. Tool Implementations

**Example: `src/tools/suno_generate_music.ts`**
```typescript
import { SunoClient } from '../utils/suno-client.js';
import { pollTaskUntilComplete } from '../utils/async-handler.js';

export async function suno_generate_music(params: {
  custom_mode: boolean;
  instrumental: boolean;
  model: string;
  prompt?: string;
  style?: string;
  title?: string;
  // ... all 14 parameters
  wait_for_completion?: boolean;
}): Promise<string> {
  try {
    const client = new SunoClient(process.env.SUNO_API_KEY!);

    // Parameter validation
    if (params.custom_mode && params.instrumental && (!params.style || !params.title)) {
      return "❌ Error: custom_mode + instrumental requires 'style' and 'title' parameters";
    }

    if (params.custom_mode && !params.instrumental && (!params.style || !params.title || !params.prompt)) {
      return "❌ Error: custom_mode + vocals requires 'style', 'title', and 'prompt' parameters";
    }

    if (!params.custom_mode && !params.prompt) {
      return "❌ Error: non-custom mode requires 'prompt' parameter";
    }

    // Character limit validation
    if (params.title && params.title.length > 80) {
      return `❌ Error: title exceeds 80 character limit (${params.title.length} chars)`;
    }

    // Generate music
    const result = await client.generateMusic({
      customMode: params.custom_mode,
      instrumental: params.instrumental,
      model: params.model as any,
      prompt: params.prompt,
      style: params.style,
      title: params.title,
      // ... map all parameters
    });

    const taskId = result.data.taskId;

    // Poll if wait_for_completion is true (default)
    if (params.wait_for_completion !== false) {
      const status = await pollTaskUntilComplete(client, taskId, 60);

      if ('response' in status && status.status === 'SUCCESS') {
        const tracks = status.response!.sunoData;
        return `✅ Music generated successfully!\n\n${tracks.map((t, i) =>
          `Track ${i + 1}: ${t.title}\n  Audio: ${t.audioUrl}\n  Duration: ${t.duration}s\n  Tags: ${t.tags}`
        ).join('\n\n')}`;
      }

      if ('status' in status && status.status === 'POLLING_TIMEOUT') {
        return `⏳ Generation in progress. Task ID: ${taskId}\n\nCheck status with: suno_get_generation_status`;
      }
    }

    return `✅ Generation started. Task ID: ${taskId}\n\nCheck status with: suno_get_generation_status`;

  } catch (error: any) {
    if (error.response?.status === 429) {
      return `❌ Insufficient credits. Check balance with: suno_check_credits`;
    }
    return `❌ Error: ${error.message}`;
  }
}
```

**Implement similar pattern for all 10 tools with:**
- Parameter validation (types, required fields, character limits)
- Conditional logic (custom_mode combinations, etc.)
- Smart polling based on operation type
- User-friendly error messages with emojis
- Formatted success responses with relevant data

### 6. Main Server (`src/index.ts`)
Register all tools with MCP SDK:
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { suno_generate_music } from './tools/suno_generate_music.js';
// ... import all tools

const server = new Server({
  name: 'suno-mcp',
  version: '1.0.0'
}, {
  capabilities: {
    tools: {}
  }
});

// Register tool: suno_generate_music
server.setRequestHandler('tools/call', async (request) => {
  if (request.params.name === 'suno_generate_music') {
    return {
      content: [{
        type: 'text',
        text: await suno_generate_music(request.params.arguments)
      }]
    };
  }
  // ... handle all 10 tools
});

server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'suno_generate_music',
        description: 'Generate AI music from text descriptions with customizable parameters',
        inputSchema: {
          type: 'object',
          properties: {
            custom_mode: { type: 'boolean', description: 'Enable custom mode for advanced settings' },
            instrumental: { type: 'boolean', description: 'Generate instrumental-only music' },
            model: { type: 'string', enum: ['V3_5', 'V4', 'V4_5', 'V4_5PLUS', 'V5'], description: 'AI model version' },
            // ... all 14 parameters with descriptions
          },
          required: ['custom_mode', 'instrumental', 'model']
        }
      },
      // ... all 10 tools
    ]
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Suno MCP server running on stdio');
}

main();
```

### 7. Docker Configuration
**`Dockerfile`:**
```dockerfile
# Builder stage
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
COPY src ./src
RUN npm install && npm run build

# Production stage
FROM node:20-slim AS production
RUN useradd -u 9003 -m mcpuser
USER mcpuser
WORKDIR /app
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
ENV NODE_ENV=production
CMD ["node", "build/index.js"]
```

### 8. Documentation (`README.md`)
Include comprehensive setup guide with:
- API key acquisition from https://sunoapi.org/api-key
- Docker build instructions
- Secret configuration
- Tool reference table with all parameters
- Usage examples for each tier
- Async behavior explanation (polling vs task_id)
- Error code reference
- Character limits and validation rules

### 9. Build & Deploy
```powershell
# Build Docker image
docker build -t suno-mcp $env:USERPROFILE/Repos/Personal/MCPs/suno-mcp

# Set API key secret
docker mcp secret set SUNO_API_KEY="your-api-key-here"

# Verify secret
docker mcp secret ls

# Test tools/list
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | docker run -i -e SUNO_API_KEY="test" suno-mcp

# Catalog entry auto-added to my-custom-catalog.yaml
# Restart Claude
```

### 10. Catalog Configuration (Auto-generated)
```yaml
suno-mcp:
  title: Suno AI Music Generation MCP Server
  image: suno-mcp
  tools:
    - name: suno_generate_music
    - name: suno_get_generation_status
    - name: suno_check_credits
    - name: suno_separate_vocals
    - name: suno_extend_music
    - name: suno_convert_to_wav
    - name: suno_generate_lyrics
    - name: suno_create_music_video
    - name: suno_add_vocals
    - name: suno_add_instrumental
  secrets:
    - name: SUNO_API_KEY
      env: SUNO_API_KEY
      example: "sk_xxxxxxxxxxxxx"
  prompts: 0
```

## Key Technical Decisions

### Async Strategy (Polling Only)
- **No webhook listener** - Keeps server stateless per MCP requirements
- **Dummy callback URL** - Pass placeholder to satisfy API requirement
- **Smart polling intervals**: Start at 2s, exponential backoff to max 5s
- **Configurable timeouts**: 60s for music/extend, 30s for vocals/WAV, 20s for lyrics
- **Task ID fallback**: Return task_id if timeout, user checks manually with suno_get_generation_status

### Parameter Validation
- **Character limits**: Enforce client-side to prevent 413 errors
- **Conditional requirements**: Validate custom_mode + instrumental combinations
- **Weight ranges**: 0.00-1.00 with 0.01 precision
- **Model matching**: For extend, ensure model matches source
- **URL validation**: Check upload_url format for add_vocals/add_instrumental

### Error Handling
- **400**: "❌ Invalid parameters: [specific validation error]"
- **409**: "❌ Resource already exists (WAV/MP4 already generated for this track)"
- **413**: "❌ Text too long: [field] exceeds [limit] chars ([actual] chars provided)"
- **429**: "❌ Insufficient credits. Check balance: suno_check_credits"
- **430**: "❌ Rate limit exceeded. Wait 10 seconds and retry"

### Response Formatting
- **Success with data**: `✅ [Operation] complete! [formatted results]`
- **Async timeout**: `⏳ [Operation] in progress. Task ID: [id]. Check status: suno_get_generation_status`
- **Credits**: `💰 Available credits: [X]`
- **Status check**: `📊 Status: [status]. [progress details]`

## Deliverables
1. ✅ TypeScript MCP server with stateless polling architecture
2. ✅ 10 tools with complete parameter support (59 total parameters)
3. ✅ Type-safe API client with all 10 endpoints
4. ✅ Smart polling handler with exponential backoff
5. ✅ Docker image ready for deployment
6. ✅ Catalog configuration with secrets
7. ✅ Comprehensive README with examples
8. ✅ Complete parameter reference documentation

## Future Enhancements (Post-MVP)
- **Webhook listener**: Optional external webhook service integration (user provides their own URL)
- **Tier 4 tools**: File upload utilities (base64/stream/URL), section replacement
- **Batch operations**: Multiple generations in single call
- **Cost estimation**: Calculate credits before operations
- **Persona management**: Create/list/delete persona tools
- **Advanced separation**: 12-stem split_stem mode UI
