/**
 * Pauses execution for a specified duration.
 *
 * Useful in E2E and integration tests when you need to wait for async
 * operations to complete before making assertions.
 *
 * @param delayInSeconds - The number of seconds to wait
 * @returns A promise that resolves after the specified delay
 *
 * @example
 * ```typescript
 * // Wait 5 seconds for an async process to complete
 * await triggerAsyncWorkflow();
 * await delay(5);
 * const result = await checkResult();
 * ```
 */
export async function delay(delayInSeconds: number) {
  await new Promise((resolve) => setTimeout(resolve, delayInSeconds * 1000));
}
