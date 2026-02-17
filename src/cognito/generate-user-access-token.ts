interface UserAccessTokenParams {
  email: string;
  password: string;
  /** Defaults to process.env.USER_POOL_CLIENT_ID */
  clientId?: string;
  /** Defaults to process.env.AWS_REGION */
  region?: string;
}

/**
 * Generates an access token using Cognito's InitiateAuth API with the USER_PASSWORD_AUTH flow.
 *
 * Useful in E2E and integration tests when you need to authenticate
 * as a specific user against protected APIs.
 *
 * @param params - The authentication parameters
 * @returns The access token string
 * @throws Error if the authentication request fails or required environment variables are missing
 *
 * @example
 * ```typescript
 * // Minimal — uses USER_POOL_CLIENT_ID and AWS_REGION environment variables
 * const token = await generateUserAccessToken({
 *   email: process.env.TEST_EMAIL,
 *   password: process.env.TEST_PASSWORD,
 * });
 *
 * // Explicit overrides
 * const token = await generateUserAccessToken({
 *   region: 'us-east-1',
 *   clientId: 'my-client-id',
 *   email: process.env.TEST_EMAIL,
 *   password: process.env.TEST_PASSWORD,
 * });
 * ```
 */
export async function generateUserAccessToken(
  params: UserAccessTokenParams,
): Promise<string> {
  const region = params.region ?? process.env.AWS_REGION;
  const clientId = params.clientId ?? process.env.USER_POOL_CLIENT_ID;

  if (!region) {
    throw new Error(
      'region is required — pass it explicitly or set AWS_REGION',
    );
  }

  if (!clientId) {
    throw new Error(
      'clientId is required — pass it explicitly or set USER_POOL_CLIENT_ID',
    );
  }

  try {
    const response = await fetch(
      `https://cognito-idp.${region}.amazonaws.com/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
        },
        body: JSON.stringify({
          AuthFlow: 'USER_PASSWORD_AUTH',
          ClientId: clientId,
          AuthParameters: {
            USERNAME: params.email,
            PASSWORD: params.password,
          },
        }),
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorData}`);
    }

    const data = (await response.json()) as {
      AuthenticationResult: { AccessToken: string };
    };
    return data.AuthenticationResult.AccessToken;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Unknown error: ${String(error)}`);
  }
}
