import { randomUUID } from 'node:crypto';

/**
 * Generates a random UUID-based identifier.
 *
 * Useful in E2E and integration tests for creating unique test data
 * that won't conflict with other test runs or existing records.
 *
 * @param length - The desired length of the ID (default: 36, max: 36)
 * @returns A random string of the specified length
 * @throws Error if length exceeds 36 characters
 *
 * @example
 * ```typescript
 * // Generate a unique user ID for test data
 * const userId = generateRandomId();
 * await putItem('users-table', {
 *   pk: `USER#${userId}`,
 *   sk: 'PROFILE',
 *   name: 'Test User'
 * });
 *
 * // Generate a shorter ID
 * const shortId = generateRandomId(8); // e.g., "a1b2c3d4"
 * ```
 */
export function generateRandomId(length = 36): string {
  if (length > 36) {
    throw new Error('max uuid v4 length is 36');
  }
  return randomUUID().substring(0, length);
}
