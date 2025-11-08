import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_BASE_URL, API_TIMEOUT, DUMMY_CALLBACK_URL } from '../config/constants.js';
import type { GenerateMusicRequest, SunoResponse, TaskResponse, GenerationStatusData } from '../types/suno-api.js';

/**
 * SunoClient handles all API communication with the Suno API
 * Uses polling-based async (no webhooks) to maintain MCP statelessness
 */
export class SunoClient {
  private client: AxiosInstance;

  constructor(apiKey: string) {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('SUNO_API_KEY is required and cannot be empty');
    }

    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: API_TIMEOUT
    });

    // Log initialization (without exposing API key)
    console.error(`[${new Date().toISOString()}] SunoClient initialized`);
  }

  /**
   * Generate music from text description
   */
  async generateMusic(params: GenerateMusicRequest): Promise<SunoResponse<TaskResponse>> {
    try {
      const response = await this.client.post('/api/v1/generate', {
        ...params,
        callBackUrl: DUMMY_CALLBACK_URL
      });
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Get status of a generation task
   */
  async getGenerationStatus(taskId: string): Promise<SunoResponse<GenerationStatusData>> {
    try {
      const response = await this.client.get('/api/v1/generate/record-info', {
        params: { taskId }
      });
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Check account credit balance
   */
  async checkCredits(): Promise<SunoResponse<number>> {
    try {
      const response = await this.client.get('/api/v1/generate/credit');
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Separate vocals from music (vocal/stem separation)
   */
  async separateVocals(taskId: string, audioId: string, separationType: string = 'separate_vocal'): Promise<SunoResponse<TaskResponse>> {
    try {
      const response = await this.client.post('/api/v1/separate', {
        taskId,
        audioId,
        separationType,
        callBackUrl: DUMMY_CALLBACK_URL
      });
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Extend an existing music track
   */
  async extendMusic(params: any): Promise<SunoResponse<TaskResponse>> {
    try {
      const response = await this.client.post('/api/v1/generate/extend', {
        ...params,
        callBackUrl: DUMMY_CALLBACK_URL
      });
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Convert audio to WAV format
   */
  async convertToWav(taskId: string, audioId: string): Promise<SunoResponse<TaskResponse>> {
    try {
      const response = await this.client.post('/api/v1/convert', {
        taskId,
        audioId,
        format: 'wav',
        callBackUrl: DUMMY_CALLBACK_URL
      });
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Generate lyrics from a theme/description
   */
  async generateLyrics(prompt: string): Promise<SunoResponse<{ lyrics: string }>> {
    try {
      const response = await this.client.post('/api/v1/lyrics', { prompt });
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Create a music video from generated audio
   */
  async createMusicVideo(taskId: string, audioId: string, author?: string, domainName?: string): Promise<SunoResponse<TaskResponse>> {
    try {
      const response = await this.client.post('/api/v1/video', {
        taskId,
        audioId,
        author,
        domainName,
        callBackUrl: DUMMY_CALLBACK_URL
      });
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Add vocals to an instrumental track
   */
  async addVocals(params: any): Promise<SunoResponse<TaskResponse>> {
    try {
      const response = await this.client.post('/api/v1/vocals', {
        ...params,
        callBackUrl: DUMMY_CALLBACK_URL
      });
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Add instrumental backing to a vocal track
   */
  async addInstrumental(params: any): Promise<SunoResponse<TaskResponse>> {
    try {
      const response = await this.client.post('/api/v1/instrumental', {
        ...params,
        callBackUrl: DUMMY_CALLBACK_URL
      });
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Handle and log API errors with appropriate context
   */
  private handleApiError(error: any): void {
    const timestamp = new Date().toISOString();

    if (error instanceof AxiosError && error.response) {
      const status = error.response.status;
      const message = (error.response.data as any)?.msg || error.message;
      console.error(`[${timestamp}] API Error ${status}: ${message}`);
    } else if (error instanceof Error) {
      console.error(`[${timestamp}] Error: ${error.message}`);
    } else {
      console.error(`[${timestamp}] Unknown error:`, error);
    }
  }
}
