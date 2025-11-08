import { SunoClient } from '../utils/suno-client.js';
import { pollTaskUntilComplete } from '../utils/async-handler.js';
import { POLLING_TIMEOUTS, CHARACTER_LIMITS } from '../config/constants.js';
import { validateCharacterLimit } from '../helpers/validation.js';

interface GenerateLyricsParams {
  prompt: string;
  wait_for_completion?: boolean;
}

/**
 * Generate lyrics from a theme or description (max 200 words)
 */
export async function suno_generate_lyrics(
  params: GenerateLyricsParams
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

    if (!params.prompt || params.prompt.trim() === '') {
      return {
        content: [{
          type: "text",
          text: "❌ Error: prompt is required"
        }]
      };
    }

    // Rough word count check (approximately 1 word per 5 chars)
    const wordEstimate = Math.ceil(params.prompt.length / 5);
    if (wordEstimate > 200) {
      return {
        content: [{
          type: "text",
          text: `❌ Error: prompt exceeds 200 word limit (estimated ${wordEstimate} words)`
        }]
      };
    }

    const client = new SunoClient(apiKey);
    const result = await client.generateLyrics(params.prompt);

    if ('data' in result && typeof result.data === 'object' && 'lyrics' in result.data) {
      const lyrics = (result.data as any).lyrics;
      return {
        content: [{
          type: "text",
          text: `✅ Lyrics generated successfully!\n\n${lyrics}`
        }]
      };
    }

    return {
      content: [{
        type: "text",
        text: "✅ Lyrics generation started"
      }]
    };

  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Error in suno_generate_lyrics:`, error);

    if (error.response?.status === 413) {
      return {
        content: [{
          type: "text",
          text: "❌ Error: Prompt text is too long. Keep it under 200 words."
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
