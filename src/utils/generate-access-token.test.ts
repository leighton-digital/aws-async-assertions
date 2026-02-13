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

  beforeEach(() => {
    global.fetch = jest.fn() as MockFetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should generate access token with client credentials', async () => {
    const mockToken = 'mock-access-token-123';
    (global.fetch as MockFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: mockToken }),
    } as Response);

    const token = await generateAccessToken(
      'https://auth.example.com',
      'client-id',
      'client-secret',
    );

    expect(token).toBe(mockToken);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://auth.example.com/oauth2/token',
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

    await generateAccessToken(
      'https://auth.example.com',
      'client-id',
      'client-secret',
      ['read', 'write'],
    );

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

    await generateAccessToken(
      'https://auth.example.com',
      'my-client',
      'my-secret',
    );

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

  it('should throw error on failed response', async () => {
    (global.fetch as MockFetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    } as Response);

    await expect(
      generateAccessToken(
        'https://auth.example.com',
        'bad-client',
        'bad-secret',
      ),
    ).rejects.toThrow('API Error: 401 - Unauthorized');
  });
});
