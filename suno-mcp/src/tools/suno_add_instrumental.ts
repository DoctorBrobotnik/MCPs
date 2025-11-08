import { SunoClient } from '../utils/suno-client.js';
import { pollTaskUntilComplete } from '../utils/async-handler.js';
import { POLLING_TIMEOUTS, CHARACTER_LIMITS } from '../config/constants.js';
import { validateWeight, validateCharacterLimit, validateUrl, validateVocalGender } from '../helpers/validation.js';

interface AddInstrumentalParams {
  upload_url: string;
  title: string;
  negative_tags: string;
  tags: string;
  vocal_gender?: string;
  style_weight?: number;
  weirdness_constraint?: number;
  audio_weight?: number;
  model?: string;
  wait_for_completion?: boolean;
}

/**
 * Add instrumental backing to a vocal track (10 parameters)
 */
export async function suno_add_instrumental(
  params: AddInstrumentalParams
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

    // Required parameter validation
    if (!params.upload_url || params.upload_url.trim() === '') {
      return {
        content: [{
          type: "text",
          text: "❌ Error: upload_url is required"
        }]
      };
    }

    if (!params.title || params.title.trim() === '') {
      return {
        content: [{
          type: "text",
          text: "❌ Error: title is required"
        }]
      };
    }

    if (!params.negative_tags || params.negative_tags.trim() === '') {
      return {
        content: [{
          type: "text",
          text: "❌ Error: negative_tags is required"
        }]
      };
    }

    if (!params.tags || params.tags.trim() === '') {
      return {
        content: [{
          type: "text",
          text: "❌ Error: tags is required"
        }]
      };
    }

    // Character limit validation
    let validationError = validateUrl('upload_url', params.upload_url);
    if (validationError) {
      return { content: [{ type: "text", text: validationError }] };
    }

    validationError = validateCharacterLimit('title', params.title, CHARACTER_LIMITS.TITLE);
    if (validationError) {
      return { content: [{ type: "text", text: validationError }] };
    }

    validationError = validateCharacterLimit('negative_tags', params.negative_tags, CHARACTER_LIMITS.NEGATIVE_TAGS);
    if (validationError) {
      return { content: [{ type: "text", text: validationError }] };
    }

    validationError = validateCharacterLimit('tags', params.tags, 1000);
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
    const result = await client.addInstrumental({
      uploadUrl: params.upload_url,
      title: params.title,
      negativeTags: params.negative_tags,
      tags: params.tags,
      vocalGender: params.vocal_gender as "m" | "f" | undefined,
      styleWeight: params.style_weight,
      weirdnessConstraint: params.weirdness_constraint,
      audioWeight: params.audio_weight,
      model: params.model || 'V4_5PLUS'
    });

    const taskId = result.data.taskId;

    if (params.wait_for_completion !== false) {
      const status = await pollTaskUntilComplete(client, taskId, POLLING_TIMEOUTS.ADD_INSTRUMENTAL);

      if ('response' in status && status.status === 'SUCCESS' && status.response?.sunoData) {
        const tracks = status.response.sunoData;
        return {
          content: [{
            type: "text",
            text: `✅ Instrumental added successfully!\n\n${tracks.map((t, i) =>
              `Track ${i + 1}: ${t.title}\n  Audio: ${t.audioUrl}`
            ).join('\n\n')}`
          }]
        };
      }

      if ('status' in status && status.status === 'POLLING_TIMEOUT') {
        return {
          content: [{
            type: "text",
            text: `⏳ Instrumental addition in progress. Task ID: ${taskId}`
          }]
        };
      }

      if ('status' in status && status.status === 'POLLING_FAILED') {
        return {
          content: [{
            type: "text",
            text: `❌ Instrumental addition failed: ${status.errorMessage}`
          }]
        };
      }
    }

    return {
      content: [{
        type: "text",
        text: `✅ Instrumental addition started. Task ID: ${taskId}`
      }]
    };

  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Error in suno_add_instrumental:`, error);

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
