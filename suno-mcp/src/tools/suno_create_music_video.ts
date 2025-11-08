import { SunoClient } from '../utils/suno-client.js';
import { pollTaskUntilComplete } from '../utils/async-handler.js';
import { POLLING_TIMEOUTS, CHARACTER_LIMITS } from '../config/constants.js';
import { validateCharacterLimit } from '../helpers/validation.js';

interface CreateMusicVideoParams {
  task_id: string;
  audio_id: string;
  author?: string;
  domain_name?: string;
  wait_for_completion?: boolean;
}

/**
 * Create a music video from generated audio
 */
export async function suno_create_music_video(
  params: CreateMusicVideoParams
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

    // Character limit validation
    let validationError = validateCharacterLimit('author', params.author, CHARACTER_LIMITS.AUTHOR);
    if (validationError) {
      return { content: [{ type: "text", text: validationError }] };
    }

    validationError = validateCharacterLimit('domain_name', params.domain_name, CHARACTER_LIMITS.DOMAIN_NAME);
    if (validationError) {
      return { content: [{ type: "text", text: validationError }] };
    }

    const client = new SunoClient(apiKey);
    const result = await client.createMusicVideo(
      params.task_id,
      params.audio_id,
      params.author,
      params.domain_name
    );

    const taskId = result.data.taskId;

    // Default to false for videos since they're slow
    if (params.wait_for_completion === true) {
      const status = await pollTaskUntilComplete(client, taskId, POLLING_TIMEOUTS.VIDEO_CREATION);

      if ('response' in status && status.status === 'SUCCESS' && status.response?.sunoData) {
        const tracks = status.response.sunoData;
        return {
          content: [{
            type: "text",
            text: `✅ Music video created!\n\n${tracks.map((t, i) =>
              `Video ${i + 1}: ${t.title}\n  URL: ${t.audioUrl}`
            ).join('\n\n')}`
          }]
        };
      }

      if ('status' in status && status.status === 'POLLING_FAILED') {
        return {
          content: [{
            type: "text",
            text: `❌ Video creation failed: ${status.errorMessage}`
          }]
        };
      }
    }

    return {
      content: [{
        type: "text",
        text: `✅ Video creation started. Task ID: ${taskId}\n\nNote: Video creation is slow. Check status with: suno_get_generation_status`
      }]
    };

  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Error in suno_create_music_video:`, error);

    if (error.response?.status === 429) {
      return {
        content: [{
          type: "text",
          text: "❌ Insufficient credits for video creation. Check balance with: suno_check_credits"
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
