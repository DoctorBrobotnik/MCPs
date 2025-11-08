import type { SunoClient } from './suno-client.js';
import type { GenerationStatusData } from '../types/suno-api.js';
import { POLLING_CONFIG } from '../config/constants.js';

/**
 * Poll a task until completion with exponential backoff
 * @param client - SunoClient instance
 * @param taskId - Task ID to poll
 * @param maxWaitMs - Maximum time to poll (milliseconds)
 * @returns Task data on completion or timeout status
 */
export async function pollTaskUntilComplete(
  client: SunoClient,
  taskId: string,
  maxWaitMs: number = 60000
): Promise<GenerationStatusData | { taskId: string; status: string; errorMessage?: string }> {
  const startTime = Date.now();
  let intervalMs: number = POLLING_CONFIG.INITIAL_INTERVAL_MS;
  let consecutiveErrors = 0;
  const MAX_CONSECUTIVE_ERRORS = 3;

  console.error(`[${new Date().toISOString()}] Starting poll for task ${taskId} (max ${maxWaitMs}ms)`);

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const result = await client.getGenerationStatus(taskId);
      consecutiveErrors = 0; // Reset error count on successful API call

      if (result.data.status === 'SUCCESS' || result.data.status.includes('FAILED')) {
        console.error(`[${new Date().toISOString()}] Task ${taskId} completed with status: ${result.data.status}`);
        return result.data;
      }

      console.error(`[${new Date().toISOString()}] Task ${taskId} status: ${result.data.status}, polling again in ${intervalMs}ms`);

      await new Promise(resolve => setTimeout(resolve, intervalMs));
      intervalMs = Math.min(intervalMs * POLLING_CONFIG.BACKOFF_MULTIPLIER, POLLING_CONFIG.MAX_INTERVAL_MS);

    } catch (error) {
      consecutiveErrors++;
      const errorMsg = error instanceof Error ? error.message : String(error);

      console.error(`[${new Date().toISOString()}] Polling error (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}): ${errorMsg}`);

      // Fail after too many consecutive errors
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        console.error(`[${new Date().toISOString()}] Max consecutive errors reached for task ${taskId}`);
        return {
          taskId,
          status: 'POLLING_FAILED',
          errorMessage: `Failed after ${consecutiveErrors} consecutive API errors: ${errorMsg}`
        };
      }

      // Continue polling with increased interval on transient errors
      intervalMs = Math.min(intervalMs * POLLING_CONFIG.BACKOFF_MULTIPLIER, POLLING_CONFIG.MAX_INTERVAL_MS);
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  // Timeout - return task_id for manual checking
  console.error(`[${new Date().toISOString()}] Task ${taskId} polling timeout after ${Date.now() - startTime}ms`);

  return { taskId, status: 'POLLING_TIMEOUT' };
}
