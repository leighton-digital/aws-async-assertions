interface AccessTokenParams {
  /** Defaults to process.env.OAUTH_COGNITO_DOMAIN */
  cognitoDomain?: string;
  /** Defaults to process.env.AWS_REGION */
  region?: string;
  /** Defaults to process.env.OAUTH_CLIENT_ID */
  clientId?: string;
  /** Defaults to process.env.OAUTH_CLIENT_SECRET */
  clientSecret?: string;
  scopes?: string[];
}

/**
 * Generates an OAuth 2.0 access token using the client credentials flow.
 *
 * Useful in E2E and integration tests when you need to authenticate
 * against protected APIs before making test requests.
 *
 * @param params - The authentication parameters
 * @returns The access token string
 * @throws Error if the token request fails or required environment variables are missing
 *
 * @example
 * ```typescript
 * // Minimal — uses environment variables
 * const token = await generateAccessToken();
 *
 * // Explicit overrides
 * const token = await generateAccessToken({
 *   cognitoDomain: 'my-app',
 *   region: 'us-east-1',
 *   clientId: 'my-client-id',
 *   clientSecret: 'my-client-secret',
 *   scopes: ['read:users', 'write:orders'],
 * });
 * ```
 */
export async function generateAccessToken(
  params: AccessTokenParams = {},
): Promise<string> {
  const cognitoDomain =
    params.cognitoDomain ?? process.env.OAUTH_COGNITO_DOMAIN;
  const region = params.region ?? process.env.AWS_REGION;
  const clientId = params.clientId ?? process.env.OAUTH_CLIENT_ID;
  const clientSecret = params.clientSecret ?? process.env.OAUTH_CLIENT_SECRET;
  const scopes = params.scopes ?? [];

  if (!cognitoDomain) {
    throw new Error(
      'cognitoDomain is required — pass it explicitly or set OAUTH_COGNITO_DOMAIN',
    );
  }

  if (!region) {
    throw new Error(
      'region is required — pass it explicitly or set AWS_REGION',
    );
  }

  if (!clientId) {
    throw new Error(
      'clientId is required — pass it explicitly or set OAUTH_CLIENT_ID',
    );
  }

  if (!clientSecret) {
    throw new Error(
      'clientSecret is required — pass it explicitly or set OAUTH_CLIENT_SECRET',
    );
  }

  try {
    const payload = new URLSearchParams({
      grant_type: 'client_credentials',
      ...(scopes.length && { scope: scopes.join(' ') }),
    });

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
      'base64',
    );

    const url = `https://${cognitoDomain}.auth.${region}.amazoncognito.com`;

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
