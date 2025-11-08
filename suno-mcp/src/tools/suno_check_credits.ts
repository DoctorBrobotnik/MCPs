import { SunoClient } from '../utils/suno-client.js';

/**
 * Check your account credit balance
 */
export async function suno_check_credits(): Promise<{ content: Array<{ type: string; text: string }> }> {
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

    const client = new SunoClient(apiKey);
    const result = await client.checkCredits();

    return {
      content: [{
        type: "text",
        text: `💰 Available credits: ${result.data}`
      }]
    };

  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Error in suno_check_credits:`, error);

    return {
      content: [{
        type: "text",
        text: `❌ Error: ${error.message}`
      }]
    };
  }
}
