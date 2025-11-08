import { SunoClient } from '../utils/suno-client.js';
import { pollTaskUntilComplete } from '../utils/async-handler.js';
import { POLLING_TIMEOUTS, CHARACTER_LIMITS } from '../config/constants.js';
import { validateWeight, validateCharacterLimit, validateModel, validateVocalGender } from '../helpers/validation.js';
import type { ModelVersion } from '../types/suno-api.js';

interface GenerateMusicParams {
  custom_mode: boolean;
  instrumental: boolean;
  model: string;
  prompt?: string;
  style?: string;
  title?: string;
  persona_id?: string;
  negative_tags?: string;
  vocal_gender?: string;
  style_weight?: number;
  weirdness_constraint?: number;
  audio_weight?: number;
  wait_for_completion?: boolean;
}

/**
 * Generate AI music from text descriptions with customizable parameters
 */
export async function suno_generate_music(
  params: GenerateMusicParams
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    // Environment validation
    const apiKey = process.env.SUNO_API_KEY;
    if (!apiKey) {
      return {
        content: [{
          type: "text",
          text: "❌ Configuration Error: SUNO_API_KEY environment variable not set"
        }]
      };
    }

    const client = new SunoClient(apiKey);

    // Model validation
    const modelError = validateModel(params.model);
    if (modelError) {
      return { content: [{ type: "text", text: modelError }] };
    }

    // Conditional parameter validation for custom_mode
    if (params.custom_mode && params.instrumental) {
      if (!params.style || !params.title) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: custom_mode + instrumental requires 'style' and 'title' parameters"
          }]
        };
      }
    } else if (params.custom_mode && !params.instrumental) {
      if (!params.style || !params.title || !params.prompt) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: custom_mode + vocals requires 'style', 'title', and 'prompt' parameters"
          }]
        };
      }
    } else if (!params.custom_mode && !params.prompt) {
      return {
        content: [{
          type: "text",
          text: "❌ Error: non-custom mode requires 'prompt' parameter"
        }]
      };
    }

    // Character limit validation
    let validationError = validateCharacterLimit('title', params.title, CHARACTER_LIMITS.TITLE);
    if (validationError) {
      return { content: [{ type: "text", text: validationError }] };
    }

    const maxPromptLen = params.custom_mode ? CHARACTER_LIMITS.PROMPT_CUSTOM_MODE : CHARACTER_LIMITS.PROMPT_SIMPLE_MODE;
    validationError = validateCharacterLimit('prompt', params.prompt, maxPromptLen);
    if (validationError) {
      return { content: [{ type: "text", text: validationError }] };
    }

    validationError = validateCharacterLimit('style', params.style, CHARACTER_LIMITS.STYLE_V4_PLUS);
    if (validationError) {
      return { content: [{ type: "text", text: validationError }] };
    }

    validationError = validateCharacterLimit('negative_tags', params.negative_tags, CHARACTER_LIMITS.NEGATIVE_TAGS);
    if (validationError) {
      return { content: [{ type: "text", text: validationError }] };
    }

    // Numeric parameter validation
    validationError = validateWeight('style_weight', params.style_weight);
    if (validationError) {
      return { content: [{ type: "text", text: validationError }] };
    }

    validationError = validateWeight('weirdness_constraint', params.weirdness_constraint);
    if (validationError) {
      return { content: [{ type: "text", text: validationError }] };
    }

    validationError = validateWeight('audio_weight', params.audio_weight);
    if (validationError) {
      return { content: [{ type: "text", text: validationError }] };
    }

    validationError = validateVocalGender(params.vocal_gender);
    if (validationError) {
      return { content: [{ type: "text", text: validationError }] };
    }

    // Generate music
    const result = await client.generateMusic({
      customMode: params.custom_mode,
      instrumental: params.instrumental,
      model: params.model as ModelVersion,
      prompt: params.prompt,
      style: params.style,
      title: params.title,
      personaId: params.persona_id,
      negativeTags: params.negative_tags,
      vocalGender: params.vocal_gender as "m" | "f" | undefined,
      styleWeight: params.style_weight,
      weirdnessConstraint: params.weirdness_constraint,
      audioWeight: params.audio_weight
    });

    const taskId = result.data.taskId;

    // Poll if wait_for_completion is true (default)
    if (params.wait_for_completion !== false) {
      const status = await pollTaskUntilComplete(client, taskId, POLLING_TIMEOUTS.MUSIC_GENERATION);

      if ('response' in status && status.status === 'SUCCESS' && status.response?.sunoData) {
        const tracks = status.response.sunoData;
        return {
          content: [{
            type: "text",
            text: `✅ Music generated successfully!\n\n${tracks.map((t, i) =>
              `Track ${i + 1}: ${t.title}\n  Audio: ${t.audioUrl}\n  Duration: ${t.duration}s\n  Tags: ${t.tags}`
            ).join('\n\n')}`
          }]
        };
      }

      if ('status' in status && status.status === 'POLLING_TIMEOUT') {
        return {
          content: [{
            type: "text",
            text: `⏳ Generation in progress. Task ID: ${taskId}\n\nCheck status with: suno_get_generation_status`
          }]
        };
      }

      if ('status' in status && status.status === 'POLLING_FAILED') {
        return {
          content: [{
            type: "text",
            text: `❌ Generation failed: ${status.errorMessage}`
          }]
        };
      }

      if ('status' in status && status.status.includes('FAILED')) {
        return {
          content: [{
            type: "text",
            text: `❌ Generation failed: ${status.errorMessage || 'Unknown error'}`
          }]
        };
      }
    }

    return {
      content: [{
        type: "text",
        text: `✅ Generation started. Task ID: ${taskId}\n\nCheck status with: suno_get_generation_status`
      }]
    };

  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Error in suno_generate_music:`, error);

    // Comprehensive HTTP error handling
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 400:
          return { content: [{ type: "text", text: `❌ Invalid parameters: ${data?.msg || error.message}` }] };
        case 409:
          return { content: [{ type: "text", text: `❌ Resource already exists: ${data?.msg || 'Operation already completed'}` }] };
        case 413:
          return { content: [{ type: "text", text: `❌ Text too long: Check character limits for prompt/style/title` }] };
        case 429:
          return { content: [{ type: "text", text: `❌ Insufficient credits. Check balance with: suno_check_credits` }] };
        case 430:
          return { content: [{ type: "text", text: `❌ Rate limit exceeded. Wait 10 seconds and retry` }] };
        default:
          return { content: [{ type: "text", text: `❌ API Error ${status}: ${data?.msg || error.message}` }] };
      }
    }

    return {
      content: [{
        type: "text",
        text: `❌ Network Error: ${error.message}`
      }]
    };
  }
}
