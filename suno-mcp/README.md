# Suno MCP Server

A comprehensive TypeScript-based Model Context Protocol (MCP) server for Suno AI music generation, providing 10 powerful tools for creating, manipulating, and enhancing AI-generated music directly within Claude.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Setup & Configuration](#setup--configuration)
- [Quick Start](#quick-start)
- [Tool Reference](#tool-reference)
- [Detailed Tool Documentation](#detailed-tool-documentation)
  - [Tier 1: Core Generation](#tier-1-core-generation)
  - [Tier 2: Audio Processing](#tier-2-audio-processing)
  - [Tier 3: Advanced Features](#tier-3-advanced-features)
- [Parameter Validation Rules](#parameter-validation-rules)
- [Async & Polling Behavior](#async--polling-behavior)
- [Error Handling](#error-handling)
- [Security & Best Practices](#security--best-practices)
- [Troubleshooting](#troubleshooting)
- [Development & Building](#development--building)
- [Architecture](#architecture)
- [API & Limits Reference](#api--limits-reference)
- [Support & Links](#support--links)
- [License](#license)
- [Changelog](#changelog)

---

## Overview

The Suno MCP Server enables Claude to interact with the Suno AI music generation platform, providing capabilities for:

- **AI Music Generation**: Create music from text descriptions with extensive customization
- **Audio Processing**: Separate vocals, extend tracks, and convert formats
- **Advanced Features**: Generate lyrics, create music videos, and layer vocals with instrumentals

The server uses a **polling-based asynchronous architecture** (no webhooks required), making it stateless and compatible with MCP requirements. All operations support both synchronous (wait for completion) and asynchronous (return task ID) modes.

### Architecture Highlights

- **10 Tools** organized in 3 tiers (Core, Processing, Advanced)
- **59 Total Parameters** with comprehensive validation
- **Exponential Backoff Polling** for efficient async operations
- **Character Limit Enforcement** to prevent API errors
- **Operation-Specific Timeouts** optimized for each task type
- **TypeScript** with strict type safety and MCP SDK v1.0.0 compliance

---

## Features

### Tier 1: Core Generation Tools
- ✅ **suno_generate_music** - Generate AI music from text with 14 customizable parameters
- ✅ **suno_get_generation_status** - Check status of any generation task
- ✅ **suno_check_credits** - View remaining account credits

### Tier 2: Audio Processing Tools
- ✅ **suno_separate_vocals** - Extract vocals or split into 12 stems
- ✅ **suno_extend_music** - Extend existing tracks with 14 parameters
- ✅ **suno_convert_to_wav** - Convert audio to WAV format

### Tier 3: Advanced Features
- ✅ **suno_generate_lyrics** - Generate song lyrics from descriptions
- ✅ **suno_create_music_video** - Create music videos with custom branding
- ✅ **suno_add_vocals** - Add vocals to instrumental tracks (11 parameters)
- ✅ **suno_add_instrumental** - Add backing music to vocals (10 parameters)

### Technical Features
- **Comprehensive Parameter Validation** - Character limits, numeric ranges, model versions
- **Smart Polling Strategy** - Starts at 2s intervals, exponential backoff to 5s max
- **Error Recovery** - Handles transient failures with automatic retry
- **Operation-Specific Timeouts** - Optimized waiting times (20s to 120s)
- **User-Friendly Error Messages** - Clear guidance with emoji prefixes

---

## Prerequisites

Before installing the Suno MCP Server, ensure you have:

1. **Node.js 18 or higher** (for local development) or **Docker** (for containerized deployment)
2. **Suno API Key** - Obtain from [https://sunoapi.org/api-key](https://sunoapi.org/api-key)
3. **Docker Desktop with MCP Gateway** (if using Docker deployment)
4. **Claude Desktop** or another MCP-compatible client

---

## Installation

### From Project Directory

```bash
cd C:\Users\WillLyons\Repos\Personal\MCPs\suno-mcp

# Install dependencies
npm install

# Build TypeScript
npm run build
```

### Docker Build

```bash
# Build the Docker image
docker build -t suno-mcp C:/Users/WillLyons/Repos/Personal/MCPs/suno-mcp
```

---

## Setup & Configuration

### Step 1: Obtain Suno API Key

1. Visit [https://sunoapi.org/api-key](https://sunoapi.org/api-key)
2. Create an account or sign in
3. Generate an API key from your dashboard
4. Save the API key securely (format: `sk_xxxxxxxxxxxxx`)

### Step 2: Set Environment Variable

**For Docker (Recommended):**

```bash
# Set the secret using Docker MCP
docker mcp secret set SUNO_API_KEY="sk_your_actual_api_key_here"

# Verify the secret was created
docker mcp secret ls
```

**For Local Development:**

**PowerShell:**
```powershell
$env:SUNO_API_KEY="sk_your_actual_api_key_here"
```

**Bash/WSL:**
```bash
export SUNO_API_KEY="sk_your_actual_api_key_here"
```

**Persistent (add to `.env` file - DO NOT commit to git):**
```env
SUNO_API_KEY=sk_your_actual_api_key_here
```

### Step 3: Catalog Configuration

The `suno-mcp` server entry has been automatically added to your custom catalog at:
- Windows: `%USERPROFILE%\.docker\mcp\catalogs\my-custom-catalog.yaml`

The catalog entry looks like:

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

### Step 4: Restart Claude

After setting the API key and verifying the catalog configuration, restart Claude Desktop for the tools to appear.

---

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Set environment variable (see Step 2 above)

# Start the server
npm start
```

### Docker Deployment

```bash
# Build the image
docker build -t suno-mcp C:/Users/WillLyons/Repos/Personal/MCPs/suno-mcp

# Test the server (list tools)
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | docker run -i -e SUNO_API_KEY="test" suno-mcp
```

### Test JSON-RPC

**List Available Tools:**

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
        "name": "suno_generate_music",
        "description": "Generate AI music from text descriptions with 14 customizable parameters...",
        "inputSchema": { ... }
      },
      ...
    ]
  }
}
```

**Test Tool Execution:**

```bash
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"suno_check_credits","arguments":{}},"id":2}' | node build/index.js
```

---

## Tool Reference

| Tool Name | Tier | Description | Required Parameters | Optional Parameters |
|-----------|------|-------------|---------------------|---------------------|
| **suno_generate_music** | 1 | Generate music from text | `custom_mode`, `instrumental`, `model` | `prompt`, `style`, `title`, `persona_id`, `negative_tags`, `vocal_gender`, `style_weight`, `weirdness_constraint`, `audio_weight`, `wait_for_completion` |
| **suno_get_generation_status** | 1 | Check task status | `task_id` | None |
| **suno_check_credits** | 1 | Check credit balance | None | None |
| **suno_separate_vocals** | 2 | Separate vocals/stems | `task_id`, `audio_id` | `separation_type`, `wait_for_completion` |
| **suno_extend_music** | 2 | Extend existing track | `default_param_flag`, `audio_id`, `model` | `prompt`, `style`, `title`, `continue_at`, `persona_id`, `negative_tags`, `vocal_gender`, `style_weight`, `weirdness_constraint`, `audio_weight`, `wait_for_completion` |
| **suno_convert_to_wav** | 2 | Convert to WAV format | `task_id`, `audio_id` | `wait_for_completion` |
| **suno_generate_lyrics** | 3 | Generate song lyrics | `prompt` | `wait_for_completion` |
| **suno_create_music_video** | 3 | Create music video | `task_id`, `audio_id` | `author`, `domain_name`, `wait_for_completion` |
| **suno_add_vocals** | 3 | Add vocals to instrumental | `prompt`, `title`, `negative_tags`, `style`, `upload_url` | `vocal_gender`, `style_weight`, `weirdness_constraint`, `audio_weight`, `model`, `wait_for_completion` |
| **suno_add_instrumental** | 3 | Add backing to vocals | `upload_url`, `title`, `negative_tags`, `tags` | `vocal_gender`, `style_weight`, `weirdness_constraint`, `audio_weight`, `model`, `wait_for_completion` |

---

## Detailed Tool Documentation

### Tier 1: Core Generation

#### suno_generate_music

**Purpose:** Generate AI music from text descriptions with extensive customization options.

**Parameters (14 total):**

| Parameter | Type | Required | Description | Constraints |
|-----------|------|----------|-------------|-------------|
| `custom_mode` | boolean | Yes | Enable custom settings (true) or auto-mode (false) | - |
| `instrumental` | boolean | Yes | Generate instrumental-only music | - |
| `model` | string | Yes | AI model version | Enum: `V3_5`, `V4`, `V4_5`, `V4_5PLUS`, `V5` |
| `prompt` | string | Conditional | Text description or lyrics | 500-3000 chars (mode-dependent) |
| `style` | string | Conditional | Music style/genre | 200-1000 chars (model-dependent) |
| `title` | string | Conditional | Song title | Max 80 chars |
| `persona_id` | string | No | Persona ID for style consistency | - |
| `negative_tags` | string | No | Styles/traits to exclude | Max 500 chars |
| `vocal_gender` | string | No | Male or female vocals | Enum: `m`, `f` |
| `style_weight` | number | No | Style influence | 0.00-1.00 |
| `weirdness_constraint` | number | No | Weirdness factor | 0.00-1.00 |
| `audio_weight` | number | No | Audio influence | 0.00-1.00 |
| `wait_for_completion` | boolean | No | Wait for generation to complete | Default: `true` |

**Mode-Specific Behavior:**

- **`custom_mode=true` + `instrumental=true`**: Requires `style` and `title` (no `prompt`)
- **`custom_mode=true` + `instrumental=false`**: Requires `style`, `title`, and `prompt`
- **`custom_mode=false`**: Requires `prompt` only (auto-generates style and title)

**Example Usage:**

```json
{
  "custom_mode": false,
  "instrumental": false,
  "model": "V4_5PLUS",
  "prompt": "Upbeat electronic dance music with energetic beats and synth melodies",
  "wait_for_completion": true
}
```

**Response:**
```
✅ Music generated successfully!

Track 1: Electric Dreams
  Audio: https://cdn.sunoapi.com/audio/xxxxx.mp3
  Duration: 180s
  Tags: electronic, dance, upbeat, synth
```

**Polling Timeout:** 60 seconds

---

#### suno_get_generation_status

**Purpose:** Check the status of any music generation task using its task ID.

**Parameters (1 total):**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | string | Yes | Task ID from any generation endpoint |

**Status Values:**
- `PENDING` - Task queued, processing not started
- `TEXT_SUCCESS` - Lyrics/metadata generated
- `FIRST_SUCCESS` - First track completed
- `SUCCESS` - All tracks completed
- `CREATE_TASK_FAILED` - Task creation failed
- `GENERATE_AUDIO_FAILED` - Audio generation failed

**Example Usage:**

```json
{
  "task_id": "abc123-def456-ghi789"
}
```

**Response:**
```
📊 Status: SUCCESS

Track 1: Electric Dreams
  Audio: https://cdn.sunoapi.com/audio/xxxxx.mp3
  Stream: https://cdn.sunoapi.com/stream/xxxxx
  Image: https://cdn.sunoapi.com/images/xxxxx.jpg
  Duration: 180s
```

---

#### suno_check_credits

**Purpose:** Check your remaining account credit balance.

**Parameters:** None

**Example Usage:**

Simply call the tool without parameters:

```json
{}
```

**Response:**
```
💰 Available credits: 150
```

**Credit Costs:**
- Music generation: 1 credit per track
- Vocal separation (2 stems): 1 credit
- Stem splitting (12 stems): 5 credits
- Music extension: 1 credit
- WAV conversion: Varies
- Video creation: Varies

---

### Tier 2: Audio Processing

#### suno_separate_vocals

**Purpose:** Separate vocals from music or split audio into multiple stems.

**Parameters (4 total):**

| Parameter | Type | Required | Description | Constraints |
|-----------|------|----------|-------------|-------------|
| `task_id` | string | Yes | Original music generation task ID | - |
| `audio_id` | string | Yes | Specific audio track ID to separate | - |
| `separation_type` | string | No | Type of separation | Enum: `separate_vocal` (2 stems, 1 credit), `split_stem` (12 stems, 5 credits). Default: `separate_vocal` |
| `wait_for_completion` | boolean | No | Wait for completion | Default: `true` |

**Separation Types:**
- **`separate_vocal`**: Splits into vocals + instrumental (2 stems, costs 1 credit)
- **`split_stem`**: Splits into 12 individual stems (bass, drums, vocals, etc., costs 5 credits)

**Example Usage:**

```json
{
  "task_id": "abc123-def456",
  "audio_id": "track_001",
  "separation_type": "separate_vocal",
  "wait_for_completion": true
}
```

**Response:**
```
✅ Vocal separation complete!

Vocals: https://cdn.sunoapi.com/audio/vocals_xxxxx.mp3
Instrumental: https://cdn.sunoapi.com/audio/instrumental_xxxxx.mp3
```

**Polling Timeout:** 30 seconds

---

#### suno_extend_music

**Purpose:** Extend an existing music track with additional content.

**Parameters (14 total):**

| Parameter | Type | Required | Description | Constraints |
|-----------|------|----------|-------------|-------------|
| `default_param_flag` | boolean | Yes | Use custom parameters (true) or original track params (false) | - |
| `audio_id` | string | Yes | Audio track to extend | - |
| `model` | string | Yes | AI model version (must match source) | Enum: `V3_5`, `V4`, `V4_5`, `V4_5PLUS`, `V5` |
| `prompt` | string | Conditional | Extension description | Max 3000 chars |
| `style` | string | Conditional | Music style | Max 200 chars |
| `title` | string | Conditional | Track title | Max 80 chars |
| `continue_at` | number | Conditional | Start time in seconds | Must be > 0 and < track duration |
| `persona_id` | string | No | Persona ID | - |
| `negative_tags` | string | No | Styles to exclude | Max 500 chars |
| `vocal_gender` | string | No | Vocal gender | Enum: `m`, `f` |
| `style_weight` | number | No | Style influence | 0.00-1.00 |
| `weirdness_constraint` | number | No | Weirdness factor | 0.00-1.00 |
| `audio_weight` | number | No | Audio influence | 0.00-1.00 |
| `wait_for_completion` | boolean | No | Wait for completion | Default: `true` |

**Example Usage:**

```json
{
  "default_param_flag": true,
  "audio_id": "track_001",
  "model": "V4_5PLUS",
  "prompt": "Continue with a dramatic orchestral crescendo",
  "style": "cinematic, orchestral",
  "title": "Extended Symphony",
  "continue_at": 120
}
```

**Polling Timeout:** 60 seconds

---

#### suno_convert_to_wav

**Purpose:** Convert generated audio to WAV format for professional use.

**Parameters (3 total):**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | string | Yes | Music generation task ID |
| `audio_id` | string | Yes | Specific track to convert |
| `wait_for_completion` | boolean | No | Wait for completion (default: `true`) |

**Example Usage:**

```json
{
  "task_id": "abc123-def456",
  "audio_id": "track_001",
  "wait_for_completion": true
}
```

**Response:**
```
✅ WAV conversion complete!

WAV File: https://cdn.sunoapi.com/audio/track_001.wav
```

**Polling Timeout:** 30 seconds

---

### Tier 3: Advanced Features

#### suno_generate_lyrics

**Purpose:** Generate song lyrics from a theme or description.

**Parameters (2 total):**

| Parameter | Type | Required | Description | Constraints |
|-----------|------|----------|-------------|-------------|
| `prompt` | string | Yes | Theme/description | Max 200 words |
| `wait_for_completion` | boolean | No | Wait for completion | Default: `true` |

**Example Usage:**

```json
{
  "prompt": "A song about chasing dreams and never giving up, with an uplifting message",
  "wait_for_completion": true
}
```

**Response:**
```
✅ Lyrics generated successfully!

[Verse 1]
Walking through the night, with stars above
Chasing every dream, with endless love
...

[Chorus]
Never give up, reach for the sky
Your dreams are calling, let your spirit fly
...
```

**Polling Timeout:** 20 seconds

---

#### suno_create_music_video

**Purpose:** Create a music video from generated audio with custom branding.

**Parameters (5 total):**

| Parameter | Type | Required | Description | Constraints |
|-----------|------|----------|-------------|-------------|
| `task_id` | string | Yes | Music generation task ID | - |
| `audio_id` | string | Yes | Track to create video for | - |
| `author` | string | No | Artist/creator name in video | Max 50 chars |
| `domain_name` | string | No | Website/brand watermark | Max 50 chars |
| `wait_for_completion` | boolean | No | Wait for completion | Default: `false` (videos are slow) |

**Example Usage:**

```json
{
  "task_id": "abc123-def456",
  "audio_id": "track_001",
  "author": "AI Musician",
  "domain_name": "mymusic.com",
  "wait_for_completion": false
}
```

**Response (if not waiting):**
```
⏳ Video creation in progress. Task ID: video_task_789

Check status with: suno_get_generation_status
```

**Polling Timeout:** 120 seconds (2 minutes)

**Note:** Video creation is slow, so `wait_for_completion` defaults to `false`.

---

#### suno_add_vocals

**Purpose:** Add vocals to an existing instrumental track.

**Parameters (11 total):**

| Parameter | Type | Required | Description | Constraints |
|-----------|------|----------|-------------|-------------|
| `prompt` | string | Yes | Vocal content/style description | - |
| `title` | string | Yes | Track title | Max 80 chars |
| `negative_tags` | string | Yes | Vocal styles to exclude | Max 500 chars |
| `style` | string | Yes | Music and vocal style | 200-1000 chars |
| `upload_url` | string | Yes | Publicly accessible instrumental audio URL | Must be valid URL |
| `vocal_gender` | string | No | Vocal gender | Enum: `m`, `f` |
| `style_weight` | number | No | Style influence | 0.00-1.00 |
| `weirdness_constraint` | number | No | Weirdness factor | 0.00-1.00 |
| `audio_weight` | number | No | Audio influence | 0.00-1.00 |
| `model` | string | No | Model version | Enum: `V4_5PLUS`, `V5`. Default: `V4_5PLUS` |
| `wait_for_completion` | boolean | No | Wait for completion | Default: `true` |

**Example Usage:**

```json
{
  "prompt": "Smooth jazz vocals with scat singing",
  "title": "Jazz Night",
  "negative_tags": "rock, screaming, metal",
  "style": "jazz, smooth, sultry",
  "upload_url": "https://example.com/instrumental.mp3",
  "vocal_gender": "f",
  "model": "V4_5PLUS"
}
```

**Important:** The `upload_url` must be publicly accessible (no authentication required).

**Polling Timeout:** 30 seconds

---

#### suno_add_instrumental

**Purpose:** Add instrumental backing music to an existing vocal track.

**Parameters (10 total):**

| Parameter | Type | Required | Description | Constraints |
|-----------|------|----------|-------------|-------------|
| `upload_url` | string | Yes | Publicly accessible vocal audio URL | Must be valid URL |
| `title` | string | Yes | Track title | Max 80 chars |
| `negative_tags` | string | Yes | Styles/instruments to exclude | Max 500 chars |
| `tags` | string | Yes | Desired instrumental characteristics | - |
| `vocal_gender` | string | No | Vocal gender | Enum: `m`, `f` |
| `style_weight` | number | No | Style influence | 0.00-1.00 |
| `weirdness_constraint` | number | No | Weirdness factor | 0.00-1.00 |
| `audio_weight` | number | No | Audio influence | 0.00-1.00 |
| `model` | string | No | Model version | Enum: `V4_5PLUS`, `V5`. Default: `V4_5PLUS` |
| `wait_for_completion` | boolean | No | Wait for completion | Default: `true` |

**Example Usage:**

```json
{
  "upload_url": "https://example.com/vocals.mp3",
  "title": "Orchestral Vocals",
  "negative_tags": "electronic, synth, techno",
  "tags": "orchestral, strings, piano, classical",
  "model": "V5"
}
```

**Polling Timeout:** 30 seconds

---

## Parameter Validation Rules

The server enforces comprehensive parameter validation to prevent API errors and ensure successful operations.

### Character Limits

| Parameter | Limit | Error if Exceeded |
|-----------|-------|-------------------|
| `title` | 80 chars | "❌ Error: title exceeds 80 character limit (X chars)" |
| `prompt` (simple mode) | 500 chars | "❌ Error: prompt exceeds 500 character limit (X chars)" |
| `prompt` (custom mode) | 3000 chars | "❌ Error: prompt exceeds 3000 character limit (X chars)" |
| `style` (V3_5) | 200 chars | "❌ Error: style exceeds 200 character limit (X chars)" |
| `style` (V4+) | 1000 chars | "❌ Error: style exceeds 1000 character limit (X chars)" |
| `negative_tags` | 500 chars | "❌ Error: negative_tags exceeds 500 character limit (X chars)" |
| `author` | 50 chars | "❌ Error: author exceeds 50 character limit (X chars)" |
| `domain_name` | 50 chars | "❌ Error: domain_name exceeds 50 character limit (X chars)" |

### Numeric Ranges

| Parameter | Range | Error if Invalid |
|-----------|-------|------------------|
| `style_weight` | 0.00-1.00 | "❌ Error: style_weight must be between 0.00 and 1.00" |
| `weirdness_constraint` | 0.00-1.00 | "❌ Error: weirdness_constraint must be between 0.00 and 1.00" |
| `audio_weight` | 0.00-1.00 | "❌ Error: audio_weight must be between 0.00 and 1.00" |
| `continue_at` | > 0 and < track duration | "❌ Error: continue_at must be positive and within track duration" |

### Enumerations

| Parameter | Valid Values | Error if Invalid |
|-----------|--------------|------------------|
| `model` | `V3_5`, `V4`, `V4_5`, `V4_5PLUS`, `V5` | "❌ Error: model must be one of: V3_5, V4, V4_5, V4_5PLUS, V5" |
| `vocal_gender` | `m`, `f` | "❌ Error: vocal_gender must be 'm' (male) or 'f' (female)" |
| `separation_type` | `separate_vocal`, `split_stem` | "❌ Error: separation_type must be 'separate_vocal' or 'split_stem'" |

### URL Validation

| Parameter | Validation | Error if Invalid |
|-----------|------------|------------------|
| `upload_url` | Must be valid URL format | "❌ Error: upload_url must be a valid URL" |
| `upload_url` | Must be publicly accessible | "❌ Error: Upload URL must be publicly accessible (no authentication)" |

---

## Async & Polling Behavior

The Suno MCP Server uses a **polling-based asynchronous architecture** to maintain statelessness while supporting long-running operations.

### Polling Strategy

- **Initial Interval:** 2 seconds
- **Exponential Backoff:** 1.2x multiplier per iteration
- **Maximum Interval:** 5 seconds (capped)
- **Error Recovery:** Tolerates up to 3 consecutive API errors before failing

### Operation-Specific Timeouts

| Operation | Timeout | Typical Completion Time |
|-----------|---------|-------------------------|
| Music generation | 60 seconds | 30-50 seconds |
| Music extension | 60 seconds | 30-50 seconds |
| Vocal separation | 30 seconds | 10-20 seconds |
| WAV conversion | 30 seconds | 10-20 seconds |
| Lyrics generation | 20 seconds | 5-15 seconds |
| Video creation | 120 seconds | 60-100 seconds |
| Add vocals | 30 seconds | 15-25 seconds |
| Add instrumental | 30 seconds | 15-25 seconds |

### wait_for_completion Parameter

All generation tools support a `wait_for_completion` parameter:

- **`true` (default for most tools):** Server polls until completion or timeout
  - Returns complete results with audio URLs when successful
  - Returns task ID if timeout occurs (you can check manually)

- **`false`:** Server returns task ID immediately
  - Use for long operations where you don't want to wait
  - Check status later with `suno_get_generation_status`

**Example: Async Mode**

```json
{
  "custom_mode": false,
  "instrumental": false,
  "model": "V4_5PLUS",
  "prompt": "Epic cinematic orchestral music",
  "wait_for_completion": false
}
```

**Response:**
```
✅ Generation started. Task ID: task_abc123

Check status with: suno_get_generation_status
```

### Getting Task Results After Timeout

If a polling timeout occurs, the server returns the task ID:

```
⏳ Generation in progress. Task ID: task_abc123

Check status with: suno_get_generation_status
```

Use `suno_get_generation_status` with the task ID to retrieve results:

```json
{
  "task_id": "task_abc123"
}
```

---

## Error Handling

The server provides comprehensive error handling with user-friendly messages and actionable guidance.

### HTTP Status Codes

| Status | Type | Example Response | User Action |
|--------|------|------------------|-------------|
| **400** | Invalid Parameters | "❌ Invalid parameters: [details]" | Fix input parameters according to validation rules |
| **409** | Resource Already Exists | "❌ Resource already exists: Operation already completed" | Check if operation was previously successful |
| **413** | Payload Too Large | "❌ Text too long: Check character limits for prompt/style/title" | Reduce text length (see Character Limits) |
| **429** | Insufficient Credits | "❌ Insufficient credits. Check balance with: suno_check_credits" | Purchase more credits or check balance |
| **430** | Rate Limited | "❌ Rate limit exceeded. Wait 10 seconds and retry" | Wait and retry (server handles with backoff) |
| **5xx** | Server Error | "❌ API Error [code]: [message]" | Retry operation, check API status |
| **Network** | Connection Failed | "❌ Network Error: [details]" | Check internet connection |

### Common Error Scenarios

#### Configuration Error

```
❌ Configuration Error: SUNO_API_KEY environment variable not set
```

**Solution:** Set the SUNO_API_KEY environment variable (see [Setup & Configuration](#setup--configuration))

#### Character Limit Exceeded

```
❌ Error: prompt exceeds 3000 character limit (3245 chars)
```

**Solution:** Reduce the prompt length to 3000 characters or less

#### Invalid Model

```
❌ Error: model must be one of: V3_5, V4, V4_5, V4_5PLUS, V5
```

**Solution:** Use a valid model version from the enumeration

#### Insufficient Credits

```
❌ Insufficient credits. Check balance with: suno_check_credits
```

**Solution:** Check your credit balance and purchase more credits at [https://sunoapi.org](https://sunoapi.org)

#### Polling Timeout

```
⏳ Generation in progress. Task ID: task_abc123

Check status with: suno_get_generation_status
```

**Solution:** Use `suno_get_generation_status` to check if the task completed after the timeout

#### Invalid Upload URL

```
❌ Error: upload_url must be a valid URL
```

**Solution:** Ensure the URL is properly formatted (e.g., `https://example.com/audio.mp3`) and publicly accessible

---

## Security & Best Practices

### API Key Management

✅ **DO:**
- Store API key in environment variables (`SUNO_API_KEY`)
- Use Docker secrets for containerized deployments: `docker mcp secret set`
- Add `.env` files to `.gitignore`
- Rotate API keys periodically

❌ **DO NOT:**
- Hardcode API keys in source code
- Commit API keys to version control
- Share API keys publicly
- Log API keys in console output

### Input Validation

The server automatically validates:
- Character limits for all text fields
- Numeric ranges for weight parameters (0.00-1.00)
- Model versions against valid enumerations
- URL formats for upload parameters
- Vocal gender values

### Upload URL Requirements

When using `suno_add_vocals` or `suno_add_instrumental`:
- URLs **must be publicly accessible** (no authentication)
- Supported formats: MP3, WAV, M4A, FLAC
- File size limits vary (check Suno API documentation)
- Use temporary hosting or CDN for private files

### Rate Limiting

- **HTTP 430** errors indicate rate limiting
- Server automatically implements exponential backoff
- Wait 10 seconds before retrying after rate limit errors
- Monitor credit usage with `suno_check_credits`

### Credit Management

Check credits before expensive operations:

```json
// Check balance first
suno_check_credits

// Then proceed with expensive operation
{
  "task_id": "abc123",
  "audio_id": "track_001",
  "separation_type": "split_stem"  // Costs 5 credits
}
```

---

## Troubleshooting

### Issue: "SUNO_API_KEY not set"

**Symptoms:** Error message about missing API key on startup

**Solution:**
```bash
# Docker
docker mcp secret set SUNO_API_KEY="sk_your_key_here"

# Local Development (PowerShell)
$env:SUNO_API_KEY="sk_your_key_here"

# Local Development (Bash)
export SUNO_API_KEY="sk_your_key_here"
```

---

### Issue: "Insufficient credits"

**Symptoms:** HTTP 429 error when attempting generation

**Solution:**
1. Check balance: Use `suno_check_credits` tool
2. Purchase credits at [https://sunoapi.org](https://sunoapi.org)
3. Verify API key is associated with correct account

---

### Issue: Polling timeout

**Symptoms:** Message indicating task is still in progress

**Solution:**
1. Task may still be processing - wait a few seconds
2. Check status manually:
   ```json
   {
     "task_id": "your_task_id_here"
   }
   ```
3. If status shows `SUCCESS`, retrieve the audio URLs
4. If status shows `FAILED`, check error message

---

### Issue: "Invalid parameters"

**Symptoms:** HTTP 400 error with validation details

**Solution:**
1. Review [Parameter Validation Rules](#parameter-validation-rules)
2. Check character limits for text fields
3. Verify numeric parameters are within 0.00-1.00 range
4. Ensure model version is valid enum value
5. Validate required parameters for custom_mode combinations

---

### Issue: "Network error"

**Symptoms:** Connection failures or timeout errors

**Solution:**
1. Check internet connection
2. Verify Suno API status at [https://sunoapi.org/status](https://sunoapi.org/status)
3. Check firewall/proxy settings
4. Retry operation after a few seconds

---

### Issue: Docker build fails

**Symptoms:** Error during `docker build` command

**Solution:**
```bash
# Check Docker is running
docker --version

# Verify path syntax (use forward slashes on Windows)
docker build -t suno-mcp C:/Users/WillLyons/Repos/Personal/MCPs/suno-mcp

# Check for TypeScript compilation errors
cd C:\Users\WillLyons\Repos\Personal\MCPs\suno-mcp
npm run build

# Review Dockerfile syntax
cat Dockerfile
```

---

### Issue: Tools not appearing in Claude

**Symptoms:** Suno tools don't show up in Claude

**Solution:**
1. Verify Docker image built successfully:
   ```bash
   docker images | grep suno-mcp
   ```
2. Check catalog configuration:
   ```bash
   # Windows
   type %USERPROFILE%\.docker\mcp\catalogs\my-custom-catalog.yaml
   ```
3. Verify secret is set:
   ```bash
   docker mcp secret ls
   ```
4. **Restart Claude Desktop** - Required after changes

---

## Development & Building

### Local Development Setup

```bash
# Clone or navigate to project directory
cd C:\Users\WillLyons\Repos\Personal\MCPs\suno-mcp

# Install dependencies
npm install

# Build TypeScript
npm run build

# Set environment variable
$env:SUNO_API_KEY="sk_your_key_here"  # PowerShell
export SUNO_API_KEY="sk_your_key_here"  # Bash

# Start the server
npm start
```

### Testing

**Test MCP Protocol (List Tools):**

**PowerShell:**
```powershell
'{"jsonrpc":"2.0","method":"tools/list","id":1}' | node build/index.js
```

**Bash:**
```bash
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node build/index.js
```

**Test Tool Execution:**

```bash
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"suno_check_credits","arguments":{}},"id":2}' | node build/index.js
```

**Expected Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "💰 Available credits: 150"
      }
    ]
  }
}
```

### Debugging

**Check TypeScript Compilation:**
```bash
npm run build
# Review any compilation errors
```

**Run with Verbose Logging:**
```bash
# Set NODE_ENV for development mode
NODE_ENV=development npm start
```

**Verify Dependencies:**
```bash
npm list --depth=0
```

**Check TypeScript Configuration:**
```bash
cat tsconfig.json
```

### Docker Testing

```bash
# Build Docker image
docker build -t suno-mcp C:/Users/WillLyons/Repos/Personal/MCPs/suno-mcp

# Test tools/list
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | docker run -i -e SUNO_API_KEY="test" suno-mcp

# Test with actual API key
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"suno_check_credits","arguments":{}},"id":2}' | docker run -i -e SUNO_API_KEY="$env:SUNO_API_KEY" suno-mcp
```

---

## Architecture

### Design Principles

- **Stateless** - No persistent connections; creates client per tool call
- **Polling-Based** - Uses exponential backoff instead of webhooks
- **Type-Safe** - Full TypeScript with strict mode
- **MCP Compliant** - Follows MCP SDK v1.0.0 specifications
- **Modular** - Organized by concerns (tools, utils, config, helpers, types)

### Project Structure

```
suno-mcp/
├── src/
│   ├── index.ts                           # Main MCP server with tool registration
│   ├── tools/                             # Tool implementations
│   │   ├── suno_generate_music.ts         # (14 params)
│   │   ├── suno_get_generation_status.ts
│   │   ├── suno_check_credits.ts
│   │   ├── suno_separate_vocals.ts        # (4 params)
│   │   ├── suno_extend_music.ts           # (14 params)
│   │   ├── suno_convert_to_wav.ts         # (3 params)
│   │   ├── suno_generate_lyrics.ts        # (2 params)
│   │   ├── suno_create_music_video.ts     # (5 params)
│   │   ├── suno_add_vocals.ts             # (11 params)
│   │   └── suno_add_instrumental.ts       # (10 params)
│   ├── utils/
│   │   ├── suno-client.ts                 # Axios-based API client
│   │   └── async-handler.ts               # Smart polling with exponential backoff
│   ├── config/
│   │   └── constants.ts                   # Timeouts, character limits, valid values
│   ├── types/
│   │   └── suno-api.ts                    # TypeScript interfaces and types
│   └── helpers/
│       └── validation.ts                  # Shared parameter validation functions
├── build/                                 # Compiled JavaScript (generated)
├── node_modules/                          # Dependencies (generated)
├── Dockerfile                             # Multi-stage Docker build
├── package.json                           # Dependencies & scripts
├── tsconfig.json                          # TypeScript configuration
├── README.md                              # This file
└── .gitignore                             # Excludes build artifacts
```

### Technology Stack

- **Runtime:** Node.js 20
- **Language:** TypeScript 5.3+ with strict mode
- **MCP SDK:** @modelcontextprotocol/sdk v1.0.0
- **HTTP Client:** Axios v1.6+
- **Container:** Docker with multi-stage build
- **Base Image:** node:20-slim

### Key Components

#### Main Server (`src/index.ts`)
- Registers all 10 tools with MCP SDK
- Validates environment (SUNO_API_KEY) at startup
- Handles tool dispatch and error recovery
- Uses stdio transport for MCP communication

#### API Client (`src/utils/suno-client.ts`)
- Axios-based wrapper for Suno API
- Bearer token authentication
- Comprehensive error handling (400, 409, 413, 429, 430, 5xx)
- Timeout enforcement (30 seconds per request)

#### Async Handler (`src/utils/async-handler.ts`)
- Smart polling with exponential backoff (2s → 5s)
- Error recovery (tolerates 3 consecutive errors)
- Operation-specific timeout management
- Task completion detection

#### Validation Helpers (`src/helpers/validation.ts`)
- Character limit enforcement
- Numeric range validation (0.00-1.00)
- Model version verification
- URL format checking
- Vocal gender validation

#### Constants (`src/config/constants.ts`)
- Polling timeouts per operation type
- Character limits for all text fields
- Valid model versions and separation types
- API configuration (base URL, timeout)

#### Type Definitions (`src/types/suno-api.ts`)
- TypeScript interfaces for all requests
- Response type definitions
- Status enumerations
- Type-safe parameter structures

---

## API & Limits Reference

### Available Models

| Model | Version | Features | Best For |
|-------|---------|----------|----------|
| **V3_5** | 3.5 | Basic generation | Quick tests, simple music |
| **V4** | 4.0 | Improved quality | General music generation |
| **V4_5** | 4.5 | Enhanced control | High-quality music |
| **V4_5PLUS** | 4.5+ | Advanced features | Professional music, vocals |
| **V5** | 5.0 | Latest model | Best quality, newest features |

### Character Limits Summary

| Field | Limit | Applies To |
|-------|-------|-----------|
| Title | 80 chars | All generation tools |
| Prompt (simple mode) | 500 chars | `suno_generate_music` (custom_mode=false) |
| Prompt (custom mode) | 3000 chars | `suno_generate_music` (custom_mode=true) |
| Style (V3_5) | 200 chars | Tools using V3_5 model |
| Style (V4+) | 1000 chars | Tools using V4, V4_5, V4_5PLUS, V5 |
| Negative Tags | 500 chars | All tools with negative_tags |
| Author | 50 chars | `suno_create_music_video` |
| Domain Name | 50 chars | `suno_create_music_video` |

### Credit Costs

| Operation | Credits | Notes |
|-----------|---------|-------|
| Music generation | 1 | Per track generated |
| Vocal separation (2 stems) | 1 | `separation_type="separate_vocal"` |
| Stem splitting (12 stems) | 5 | `separation_type="split_stem"` |
| Music extension | 1 | Per extension operation |
| WAV conversion | Varies | Check API documentation |
| Video creation | Varies | Check API documentation |
| Add vocals | 1 | Per vocal addition |
| Add instrumental | 1 | Per instrumental addition |

### Timeout Reference

| Tool | Timeout | Reason |
|------|---------|--------|
| `suno_generate_music` | 60s | Music generation is moderately slow |
| `suno_extend_music` | 60s | Similar complexity to generation |
| `suno_separate_vocals` | 30s | Audio processing is faster |
| `suno_convert_to_wav` | 30s | Simple format conversion |
| `suno_generate_lyrics` | 20s | Text generation is fast |
| `suno_create_music_video` | 120s | Video rendering is very slow |
| `suno_add_vocals` | 30s | Audio mixing operation |
| `suno_add_instrumental` | 30s | Audio mixing operation |

---

## Support & Links

### Official Documentation

- **Suno API Documentation:** [https://sunoapi.org/docs](https://sunoapi.org/docs)
- **API Key Management:** [https://sunoapi.org/api-key](https://sunoapi.org/api-key)
- **MCP Protocol:** [https://modelcontextprotocol.io](https://modelcontextprotocol.io)
- **MCP SDK Documentation:** [https://modelcontextprotocol.io/docs/sdk](https://modelcontextprotocol.io/docs/sdk)

### Project Resources

- **GitHub Repository:** [https://github.com/DoctorBrobotnik/MCPs](https://github.com/DoctorBrobotnik/MCPs)
- **Issue Tracker:** [https://github.com/DoctorBrobotnik/MCPs/issues](https://github.com/DoctorBrobotnik/MCPs/issues)

### Community & Support

For questions, issues, or feature requests:
1. Check this README's [Troubleshooting](#troubleshooting) section
2. Review the [Suno API Documentation](https://sunoapi.org/docs)
3. Open an issue on GitHub with detailed information

---

## License

This project is part of the MCPs repository. Please refer to the repository license for terms of use.

---

## Changelog

### Version 1.0.0 (Initial Release)

**Features:**
- ✅ 10 tools across 3 tiers (Core, Processing, Advanced)
- ✅ 59 total parameters with comprehensive validation
- ✅ Polling-based async architecture with exponential backoff
- ✅ Operation-specific timeout management
- ✅ Complete error handling for all HTTP status codes
- ✅ TypeScript with strict mode and type safety
- ✅ Docker deployment with multi-stage build
- ✅ Non-root container user (UID 9003)
- ✅ MCP SDK v1.0.0 compliance

**Tools Included:**
- `suno_generate_music` - Generate music with 14 parameters
- `suno_get_generation_status` - Check task status
- `suno_check_credits` - View credit balance
- `suno_separate_vocals` - Vocal/stem separation (2 or 12 stems)
- `suno_extend_music` - Extend tracks with 14 parameters
- `suno_convert_to_wav` - Convert to WAV format
- `suno_generate_lyrics` - Generate song lyrics
- `suno_create_music_video` - Create music videos with branding
- `suno_add_vocals` - Add vocals to instrumentals (11 parameters)
- `suno_add_instrumental` - Add backing to vocals (10 parameters)

**Technical Improvements:**
- Character limit enforcement (80-3000 chars depending on field)
- Numeric range validation (0.00-1.00 for all weights)
- Model version validation (V3_5, V4, V4_5, V4_5PLUS, V5)
- URL format validation for upload parameters
- Conditional parameter logic for custom_mode combinations
- Smart polling with error recovery (tolerates 3 consecutive errors)
- ISO timestamp logging to stderr

**Documentation:**
- Comprehensive README with 20+ sections
- Parameter reference with all 59 parameters documented
- Error code reference with solutions
- Troubleshooting guide
- Architecture and design documentation
- API limits and credit cost reference

---

## Glossary

- **MCP (Model Context Protocol)** - Protocol for extending Claude's capabilities with custom tools
- **Task ID** - Unique identifier for async operations, used to check status and retrieve results
- **Polling** - Repeatedly checking task status until completion or timeout
- **Exponential Backoff** - Strategy of increasing wait time between checks (e.g., 2s → 2.4s → 2.88s)
- **Persona** - Style consistency identifier for maintaining similar characteristics across generations
- **Stem** - Individual audio track separated from a mix (vocals, bass, drums, etc.)
- **Custom Mode** - Advanced generation mode with manual control over style, title, and prompt
- **Auto Mode** - Simple generation mode where API generates style and title automatically
- **Instrumental** - Music without vocals
- **Vocal Gender** - Specifies male (m) or female (f) voice characteristics
- **Style Weight** - How strongly the style parameter influences generation (0.00-1.00)
- **Weirdness Constraint** - Controls experimental/unusual qualities in generation (0.00-1.00)
- **Audio Weight** - Influence of uploaded audio on generated output (0.00-1.00)

---

**Built with:**
- [MCP SDK](https://modelcontextprotocol.io) - Model Context Protocol
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Axios](https://axios-http.com/) - HTTP client
- [Suno API](https://sunoapi.org) - AI music generation

**Maintained by:** [DoctorBrobotnik](https://github.com/DoctorBrobotnik)

---

**Ready to create amazing AI-generated music? Set your API key and start generating!** 🎵
