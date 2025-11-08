import { SunoClient } from '../utils/suno-client.js';
import { pollTaskUntilComplete } from '../utils/async-handler.js';
import { POLLING_TIMEOUTS } from '../config/constants.js';

interface ConvertToWavParams {
  task_id: string;
  audio_id: string;
  wait_for_completion?: boolean;
}

/**
 * Convert generated music to WAV format
 */
export async function suno_convert_to_wav(
  params: ConvertToWavParams
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

    const client = new SunoClient(apiKey);
    const result = await client.convertToWav(params.task_id, params.audio_id);

    const taskId = result.data.taskId;

    if (params.wait_for_completion !== false) {
      const status = await pollTaskUntilComplete(client, taskId, POLLING_TIMEOUTS.WAV_CONVERSION);

      if ('response' in status && status.status === 'SUCCESS' && status.response?.sunoData) {
        const tracks = status.response.sunoData;
        return {
          content: [{
            type: "text",
            text: `✅ WAV conversion completed!\n\n${tracks.map((t, i) =>
              `Track ${i + 1}: ${t.title}\n  Audio: ${t.audioUrl}`
            ).join('\n\n')}`
          }]
        };
      }

      if ('status' in status && status.status === 'POLLING_TIMEOUT') {
        return {
          content: [{
            type: "text",
            text: `⏳ Conversion in progress. Task ID: ${taskId}`
          }]
        };
      }

      if ('status' in status && status.status === 'POLLING_FAILED') {
        return {
          content: [{
            type: "text",
            text: `❌ Conversion failed: ${status.errorMessage}`
          }]
        };
      }
    }

    return {
      content: [{
        type: "text",
        text: `✅ Conversion started. Task ID: ${taskId}`
      }]
    };

  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Error in suno_convert_to_wav:`, error);

    return {
      content: [{
        type: "text",
        text: `❌ Error: ${error.message}`
      }]
    };
  }
}
