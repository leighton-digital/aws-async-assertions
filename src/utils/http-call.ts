/**
 * Makes an HTTP request to an API endpoint.
 *
 * Useful in E2E and integration tests for triggering API endpoints
 * and verifying responses. Includes a 10-second timeout by default.
 *
 * @typeParam T - The expected response type
 * @param endpoint - The base URL of the API (e.g., 'https://api.example.com')
 * @param resource - The resource path (e.g., '/users/123')
 * @param method - The HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param payload - Optional request body for POST/PUT requests
 * @param headers - Optional additional headers to include
 * @returns The parsed JSON response
 * @throws Error if the request fails or returns a non-2xx status
 *
 * @example
 * ```typescript
 * // Trigger an order creation endpoint
 * const order = await httpCall<Order>(
 *   'https://api.example.com',
 *   '/orders',
 *   'POST',
 *   { productId: 'PROD-123', quantity: 2 },
 *   { Authorization: `Bearer ${token}` }
 * );
 *
 * // Then verify the order was persisted
 * const { items } = await query<Order>({
 *   tableName: 'orders-table',
 *   keyConditionExpression: 'pk = :pk',
 *   expressionAttributeValues: { ':pk': `ORDER#${order.id}` }
 * });
 * expect(items[0].status).toBe('PENDING');
 * ```
 *
 * @example
 * ```typescript
 * // Simple GET request
 * const user = await httpCall<User>(
 *   'https://api.example.com',
 *   '/users/123',
 *   'GET'
 * );
 * ```
 */
export async function httpCall<T>(
  endpoint: string,
  resource: string,
  method: string,
  payload?: Record<string, string | boolean | object | number>,
  headers?: Record<string, string>,
): Promise<T> {
  const url = `${endpoint}${resource}`;

  try {
    const response = await fetch(url, {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: payload ? JSON.stringify(payload) : undefined,
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorData}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Unknown error: ${String(error)}`);
  }
}
