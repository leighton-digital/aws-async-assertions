import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { generateAccessToken } from './generate-access-token';

type MockFetch = jest.Mock<typeof fetch>;

describe('generateAccessToken', () => {
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

  it('should generate access token with client credentials', async () => {
    const mockToken = 'mock-access-token-123';
    (global.fetch as MockFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: mockToken }),
    } as Response);

    const token = await generateAccessToken({
      cognitoDomain: 'my-app',
      region: 'us-east-1',
      clientId: 'client-id',
      clientSecret: 'client-secret',
    });

    expect(token).toBe(mockToken);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://my-app.auth.us-east-1.amazoncognito.com/oauth2/token',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: expect.stringMatching(/^Basic /),
        }),
      }),
    );
  });

  it('should include scopes when provided', async () => {
    const mockToken = 'mock-token';
    (global.fetch as MockFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: mockToken }),
    } as Response);

    await generateAccessToken({
      cognitoDomain: 'my-app',
      region: 'us-east-1',
      clientId: 'client-id',
      clientSecret: 'client-secret',
      scopes: ['read', 'write'],
    });

    const callArgs = (global.fetch as MockFetch).mock.calls[0];
    expect(callArgs).toBeDefined();
    const body = callArgs?.[1]?.body;
    expect(body).toContain('scope=read+write');
  });

  it('should encode credentials in base64', async () => {
    const mockToken = 'token';
    (global.fetch as MockFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: mockToken }),
    } as Response);

    await generateAccessToken({
      cognitoDomain: 'my-app',
      region: 'us-east-1',
      clientId: 'my-client',
      clientSecret: 'my-secret',
    });

    const callArgs = (global.fetch as MockFetch).mock.calls[0];
    expect(callArgs).toBeDefined();
    const headers = callArgs?.[1]?.headers as
      | Record<string, string>
      | undefined;
    const authHeader = headers?.Authorization;
    expect(authHeader).toBeDefined();
    const base64Credentials = authHeader?.replace('Basic ', '') ?? '';
    const decoded = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    expect(decoded).toBe('my-client:my-secret');
  });

  it('should fall back to environment variables when params are omitted', async () => {
    process.env.OAUTH_COGNITO_DOMAIN = 'env-app';
    process.env.AWS_REGION = 'eu-west-1';
    process.env.OAUTH_CLIENT_ID = 'env-client-id';
    process.env.OAUTH_CLIENT_SECRET = 'env-client-secret';

    (global.fetch as MockFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'token' }),
    } as Response);

    await generateAccessToken();

    const callArgs = (global.fetch as MockFetch).mock.calls[0];
    expect(callArgs?.[0]).toBe(
      'https://env-app.auth.eu-west-1.amazoncognito.com/oauth2/token',
    );
    const headers = callArgs?.[1]?.headers as Record<string, string>;
    const decoded = Buffer.from(
      headers.Authorization.replace('Basic ', ''),
      'base64',
    ).toString('utf-8');
    expect(decoded).toBe('env-client-id:env-client-secret');
  });

  it('should throw when cognitoDomain is missing and OAUTH_COGNITO_DOMAIN is not set', async () => {
    delete process.env.OAUTH_COGNITO_DOMAIN;

    await expect(
      generateAccessToken({
        region: 'us-east-1',
        clientId: 'id',
        clientSecret: 'secret',
      }),
    ).rejects.toThrow('cognitoDomain is required');
  });

  it('should throw when region is missing and AWS_REGION is not set', async () => {
    delete process.env.AWS_REGION;

    await expect(
      generateAccessToken({
        cognitoDomain: 'my-app',
        clientId: 'id',
        clientSecret: 'secret',
      }),
    ).rejects.toThrow('region is required');
  });

  it('should throw when clientId is missing and OAUTH_CLIENT_ID is not set', async () => {
    delete process.env.OAUTH_CLIENT_ID;

    await expect(
      generateAccessToken({
        cognitoDomain: 'my-app',
        region: 'us-east-1',
        clientSecret: 'secret',
      }),
    ).rejects.toThrow('clientId is required');
  });

  it('should throw when clientSecret is missing and OAUTH_CLIENT_SECRET is not set', async () => {
    delete process.env.OAUTH_CLIENT_SECRET;

    await expect(
      generateAccessToken({
        cognitoDomain: 'my-app',
        region: 'us-east-1',
        clientId: 'id',
      }),
    ).rejects.toThrow('clientSecret is required');
  });

  it('should throw error on failed response', async () => {
    (global.fetch as MockFetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    } as Response);

    await expect(
      generateAccessToken({
        cognitoDomain: 'my-app',
        region: 'us-east-1',
        clientId: 'bad-client',
        clientSecret: 'bad-secret',
      }),
    ).rejects.toThrow('API Error: 401 - Unauthorized');
  });
});
