import { SunoClient } from '../utils/suno-client.js';
import { pollTaskUntilComplete } from '../utils/async-handler.js';
import { POLLING_TIMEOUTS } from '../config/constants.js';

interface SeparateVocalsParams {
  task_id: string;
  audio_id: string;
  separation_type?: string;
  wait_for_completion?: boolean;
}

/**
 * Separate vocals from music or split into stems (1-5 credits)
 */
export async function suno_separate_vocals(
  params: SeparateVocalsParams
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

    if (!params.task_id || params.task_id.trim() === '') {
      return {
        content: [{
          type: "text",
          text: "❌ Error: task_id is required"
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

    const separationType = params.separation_type || 'separate_vocal';
    if (!['separate_vocal', 'split_stem'].includes(separationType)) {
      return {
        content: [{
          type: "text",
          text: "❌ Error: separation_type must be 'separate_vocal' or 'split_stem'"
        }]
      };
    }

    const client = new SunoClient(apiKey);
    const result = await client.separateVocals(params.task_id, params.audio_id, separationType);

    const taskId = result.data.taskId;

    if (params.wait_for_completion !== false) {
      const status = await pollTaskUntilComplete(client, taskId, POLLING_TIMEOUTS.VOCAL_SEPARATION);

      if ('response' in status && status.status === 'SUCCESS' && status.response?.sunoData) {
        const tracks = status.response.sunoData;
        return {
          content: [{
            type: "text",
            text: `✅ Vocal separation completed!\n\n${tracks.map((t, i) =>
              `Track ${i + 1}: ${t.title}\n  Audio: ${t.audioUrl}`
            ).join('\n\n')}`
          }]
        };
      }

      if ('status' in status && status.status === 'POLLING_TIMEOUT') {
        return {
          content: [{
            type: "text",
            text: `⏳ Separation in progress. Task ID: ${taskId}`
          }]
        };
      }

      if ('status' in status && status.status === 'POLLING_FAILED') {
        return {
          content: [{
            type: "text",
            text: `❌ Separation failed: ${status.errorMessage}`
          }]
        };
      }
    }

    return {
      content: [{
        type: "text",
        text: `✅ Separation started. Task ID: ${taskId}`
      }]
    };

  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Error in suno_separate_vocals:`, error);

    if (error.response?.status === 429) {
      return {
        content: [{
          type: "text",
          text: "❌ Insufficient credits for separation. Check balance with: suno_check_credits"
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
