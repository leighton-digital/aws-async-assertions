import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { generateUserAccessToken } from './generate-user-access-token';

type MockFetch = jest.Mock<typeof fetch>;

describe('generateUserAccessToken', () => {
  const originalFetch = global.fetch;
  const originalEnv = process.env;

  beforeEach(() => {
    global.fetch = jest.fn() as MockFetch;
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env = originalEnv;
  });

  it('should generate access token via Cognito InitiateAuth', async () => {
    const mockToken = 'mock-user-token-456';
    (global.fetch as MockFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        AuthenticationResult: { AccessToken: mockToken },
      }),
    } as Response);

    const token = await generateUserAccessToken({
      region: 'us-east-1',
      clientId: 'app-client-id',
      email: 'user@example.com',
      password: 'test-pass',
    });

    expect(token).toBe(mockToken);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://cognito-idp.us-east-1.amazonaws.com/',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
        }),
      }),
    );
  });

  it('should send correct auth payload', async () => {
    (global.fetch as MockFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        AuthenticationResult: { AccessToken: 'token' },
      }),
    } as Response);

    await generateUserAccessToken({
      region: 'eu-west-1',
      clientId: 'my-client-id',
      email: 'user@example.com',
      password: 'test-pass',
    });

    const callArgs = (global.fetch as MockFetch).mock.calls[0];
    expect(callArgs).toBeDefined();
    const body = JSON.parse(callArgs?.[1]?.body as string);
    expect(body).toEqual({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: 'my-client-id',
      AuthParameters: {
        USERNAME: 'user@example.com',
        PASSWORD: 'test-pass',
      },
    });
  });

  it('should fall back to env vars when region and clientId are omitted', async () => {
    process.env.AWS_REGION = 'ap-southeast-1';
    process.env.USER_POOL_CLIENT_ID = 'env-client-id';

    (global.fetch as MockFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        AuthenticationResult: { AccessToken: 'token' },
      }),
    } as Response);

    await generateUserAccessToken({
      email: 'user@example.com',
      password: 'test-pass',
    });

    const callArgs = (global.fetch as MockFetch).mock.calls[0];
    expect(callArgs?.[0]).toBe(
      'https://cognito-idp.ap-southeast-1.amazonaws.com/',
    );
    const body = JSON.parse(callArgs?.[1]?.body as string);
    expect(body.ClientId).toBe('env-client-id');
  });

  it('should throw when region is missing and AWS_REGION is not set', async () => {
    delete process.env.AWS_REGION;

    await expect(
      generateUserAccessToken({
        clientId: 'client-id',
        email: 'user@example.com',
        password: 'test-pass',
      }),
    ).rejects.toThrow('region is required');
  });

  it('should throw when clientId is missing and USER_POOL_CLIENT_ID is not set', async () => {
    delete process.env.USER_POOL_CLIENT_ID;

    await expect(
      generateUserAccessToken({
        region: 'us-east-1',
        email: 'user@example.com',
        password: 'test-pass',
      }),
    ).rejects.toThrow('clientId is required');
  });

  it('should throw error on failed response', async () => {
    (global.fetch as MockFetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () =>
        'NotAuthorizedException: Incorrect username or password.',
    } as Response);

    await expect(
      generateUserAccessToken({
        region: 'us-east-1',
        clientId: 'client-id',
        email: 'bad@example.com',
        password: 'bad-pass',
      }),
    ).rejects.toThrow(
      'API Error: 400 - NotAuthorizedException: Incorrect username or password.',
    );
  });
});
