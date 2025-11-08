import { SunoClient } from '../utils/suno-client.js';
import { pollTaskUntilComplete } from '../utils/async-handler.js';
import { POLLING_TIMEOUTS, CHARACTER_LIMITS } from '../config/constants.js';
import { validateWeight, validateCharacterLimit, validateModel, validateVocalGender } from '../helpers/validation.js';
import type { ModelVersion } from '../types/suno-api.js';

interface ExtendMusicParams {
  default_param_flag: boolean;
  audio_id: string;
  model: string;
  prompt?: string;
  style?: string;
  title?: string;
  continue_at?: number;
  persona_id?: string;
  negative_tags?: string;
  vocal_gender?: string;
  style_weight?: number;
  weirdness_constraint?: number;
  audio_weight?: number;
  wait_for_completion?: boolean;
}

/**
 * Extend an existing music track with customizable parameters
 */
export async function suno_extend_music(
  params: ExtendMusicParams
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    const apiKey = process.env.SUNO_API_KEY;
    if (!apiKey) {
      return {
        content: [{
          type: "text",
          text: "❌ Configuration Error: SUNO_API_KEY environment variable not set"
        }]
      };
    }

    if (!params.audio_id || params.audio_id.trim() === '') {
      return {
        content: [{
          type: "text",
          text: "❌ Error: audio_id is required"
        }]
      };
    }

    const modelError = validateModel(params.model);
    if (modelError) {
      return { content: [{ type: "text", text: modelError }] };
    }

    // Character limit validation
    let validationError = validateCharacterLimit('prompt', params.prompt, CHARACTER_LIMITS.PROMPT_CUSTOM_MODE);
    if (validationError) {
      return { content: [{ type: "text", text: validationError }] };
    }

    validationError = validateCharacterLimit('style', params.style, CHARACTER_LIMITS.STYLE_V4_PLUS);
    if (validationError) {
      return { content: [{ type: "text", text: validationError }] };
    }

    validationError = validateCharacterLimit('title', params.title, CHARACTER_LIMITS.TITLE);
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

    const client = new SunoClient(apiKey);
    const result = await client.extendMusic({
      defaultParamFlag: params.default_param_flag,
      audioId: params.audio_id,
      model: params.model as ModelVersion,
      prompt: params.prompt,
      style: params.style,
      title: params.title,
      continueAt: params.continue_at,
      personaId: params.persona_id,
      negativeTags: params.negative_tags,
      vocalGender: params.vocal_gender as "m" | "f" | undefined,
      styleWeight: params.style_weight,
      weirdnessConstraint: params.weirdness_constraint,
      audioWeight: params.audio_weight
    });

    const taskId = result.data.taskId;

    if (params.wait_for_completion !== false) {
      const status = await pollTaskUntilComplete(client, taskId, POLLING_TIMEOUTS.MUSIC_EXTENSION);

      if ('response' in status && status.status === 'SUCCESS' && status.response?.sunoData) {
        const tracks = status.response.sunoData;
        return {
          content: [{
            type: "text",
            text: `✅ Music extended successfully!\n\n${tracks.map((t, i) =>
              `Track ${i + 1}: ${t.title}\n  Audio: ${t.audioUrl}\n  Duration: ${t.duration}s`
            ).join('\n\n')}`
          }]
        };
      }

      if ('status' in status && status.status === 'POLLING_TIMEOUT') {
        return {
          content: [{
            type: "text",
            text: `⏳ Extension in progress. Task ID: ${taskId}`
          }]
        };
      }

      if ('status' in status && status.status === 'POLLING_FAILED') {
        return {
          content: [{
            type: "text",
            text: `❌ Extension failed: ${status.errorMessage}`
          }]
        };
      }
    }

    return {
      content: [{
        type: "text",
        text: `✅ Extension started. Task ID: ${taskId}`
      }]
    };

  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Error in suno_extend_music:`, error);

    if (error.response?.status === 429) {
      return {
        content: [{
          type: "text",
          text: "❌ Insufficient credits. Check balance with: suno_check_credits"
        }]
      };
    }

    return {
      content: [{
        type: "text",
        text: `❌ Error: ${error.message}`
      }]
    };
  }
}
