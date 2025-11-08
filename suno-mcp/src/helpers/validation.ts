import { CHARACTER_LIMITS, VALID_MODELS, VALID_VOCAL_GENDERS } from '../config/constants.js';
import type { ModelVersion, VocalGender } from '../types/suno-api.js';

/**
 * Validate numeric weight parameters (0.00-1.00)
 */
export function validateWeight(name: string, value?: number): string | null {
  if (value === undefined) return null;

  const num = Number(value);
  if (isNaN(num) || num < 0 || num > 1) {
    return `❌ Error: ${name} must be between 0.00 and 1.00`;
  }
  return null;
}

/**
 * Validate character limits for text fields
 */
export function validateCharacterLimit(fieldName: string, value: string | undefined, limit: number): string | null {
  if (!value) return null;

  if (value.length > limit) {
    return `❌ Error: ${fieldName} exceeds ${limit} character limit (${value.length} chars)`;
  }
  return null;
}

/**
 * Validate model version
 */
export function validateModel(model: string): string | null {
  if (!(VALID_MODELS as readonly string[]).includes(model)) {
    return `❌ Error: model must be one of: ${VALID_MODELS.join(', ')}`;
  }
  return null;
}

/**
 * Validate vocal gender
 */
export function validateVocalGender(gender: string | undefined): string | null {
  if (!gender) return null;

  if (!(VALID_VOCAL_GENDERS as readonly string[]).includes(gender)) {
    return `❌ Error: vocal_gender must be 'm' (male) or 'f' (female)`;
  }
  return null;
}

/**
 * Validate URL format (basic check)
 */
export function validateUrl(fieldName: string, url: string | undefined): string | null {
  if (!url) return null;

  try {
    new URL(url);
    return null;
  } catch {
    return `❌ Error: ${fieldName} must be a valid URL`;
  }
}
