/**
 * Operation-specific polling timeouts in milliseconds
 */
export const POLLING_TIMEOUTS = {
  MUSIC_GENERATION: 60000,      // 60 seconds for music generation
  MUSIC_EXTENSION: 60000,       // 60 seconds for extending tracks
  VOCAL_SEPARATION: 30000,      // 30 seconds for vocal separation
  WAV_CONVERSION: 30000,        // 30 seconds for WAV conversion
  LYRICS_GENERATION: 20000,     // 20 seconds for lyrics generation
  VIDEO_CREATION: 120000,       // 120 seconds for video creation (slow operation)
  ADD_VOCALS: 30000,            // 30 seconds for adding vocals
  ADD_INSTRUMENTAL: 30000       // 30 seconds for adding instrumental
} as const;

/**
 * Character limits for various text fields
 */
export const CHARACTER_LIMITS = {
  TITLE: 80,
  PROMPT_SIMPLE_MODE: 500,
  PROMPT_CUSTOM_MODE: 3000,
  STYLE_V3_5: 200,
  STYLE_V4_PLUS: 1000,
  NEGATIVE_TAGS: 500,
  AUTHOR: 50,
  DOMAIN_NAME: 50
} as const;

/**
 * Polling configuration
 */
export const POLLING_CONFIG = {
  INITIAL_INTERVAL_MS: 2000,     // Start polling every 2 seconds
  MAX_INTERVAL_MS: 5000,         // Cap at 5 seconds
  BACKOFF_MULTIPLIER: 1.2        // Increase interval by 20% each iteration
} as const;

/**
 * Valid model versions
 */
export const VALID_MODELS = ["V3_5", "V4", "V4_5", "V4_5PLUS", "V5"] as const;

/**
 * Valid separation types and their credit costs
 */
export const SEPARATION_TYPES = {
  SEPARATE_VOCAL: { type: "separate_vocal", stems: 2, credits: 1 },
  SPLIT_STEM: { type: "split_stem", stems: 12, credits: 5 }
} as const;

/**
 * Valid vocal genders
 */
export const VALID_VOCAL_GENDERS = ["m", "f"] as const;

/**
 * API endpoint base URL
 */
export const API_BASE_URL = "https://api.sunoapi.org" as const;

/**
 * Request timeout for API calls (milliseconds)
 */
export const API_TIMEOUT = 30000 as const;

/**
 * Dummy callback URL used for polling-based operations
 */
export const DUMMY_CALLBACK_URL = "https://api-placeholder.local/webhook" as const;
