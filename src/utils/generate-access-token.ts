/**
 * Generates an OAuth 2.0 access token using the client credentials flow.
 *
 * Useful in E2E and integration tests when you need to authenticate
 * against protected APIs before making test requests.
 *
 * @param url - The base URL of the OAuth server (without /oauth2/token)
 * @param clientId - The OAuth client ID
 * @param clientSecret - The OAuth client secret
 * @param scopes - Optional array of scopes to request (default: [])
 * @returns The access token string
 * @throws Error if the token request fails
 *
 * @example
 * ```typescript
 * // Get a token to authenticate API calls in tests
 * const token = await generateAccessToken(
 *   'https://auth.example.com',
 *   process.env.CLIENT_ID,
 *   process.env.CLIENT_SECRET,
 *   ['read:users', 'write:orders']
 * );
 *
 * // Use the token in subsequent API calls
 * const response = await httpCall(
 *   'https://api.example.com',
 *   '/users',
 *   'GET',
 *   undefined,
 *   { Authorization: `Bearer ${token}` }
 * );
 * ```
 */
export async function generateAccessToken(
  url: string,
  clientId: string,
  clientSecret: string,
  scopes: string[] = [],
): Promise<string> {
  try {
    const payload = new URLSearchParams({
      grant_type: 'client_credentials',
      ...(scopes.length && { scope: scopes.join(' ') }),
    });

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
      'base64',
    );

    const response = await fetch(`${url}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: payload.toString(),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorData}`);
    }

    const data = (await response.json()) as { access_token: string };
    return data.access_token;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Unknown error: ${String(error)}`);
  }
}
