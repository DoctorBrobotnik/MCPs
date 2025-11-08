import { SunoClient } from '../utils/suno-client.js';

interface GetStatusParams {
  task_id: string;
}

/**
 * Check the status of a music generation task by task ID
 */
export async function suno_get_generation_status(
  params: GetStatusParams
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

    const client = new SunoClient(apiKey);
    const result = await client.getGenerationStatus(params.task_id);

    if (result.data.status === 'SUCCESS' && result.data.response?.sunoData) {
      const tracks = result.data.response.sunoData;
      return {
        content: [{
          type: "text",
          text: `✅ Task completed successfully!\n\n${tracks.map((t, i) =>
            `Track ${i + 1}: ${t.title}\n  Audio: ${t.audioUrl}\n  Duration: ${t.duration}s\n  Tags: ${t.tags}`
          ).join('\n\n')}`
        }]
      };
    }

    if (result.data.status.includes('FAILED')) {
      return {
        content: [{
          type: "text",
          text: `❌ Task failed: ${result.data.errorMessage || 'Unknown error'}`
        }]
      };
    }

    return {
      content: [{
        type: "text",
        text: `📊 Task Status: ${result.data.status}\n\nTask ID: ${params.task_id}`
      }]
    };

  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Error in suno_get_generation_status:`, error);

    if (error.response?.status === 404) {
      return {
        content: [{
          type: "text",
          text: "❌ Task not found. Check that the task_id is correct."
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
