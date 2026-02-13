import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { httpCall } from './http-call';

type MockFetch = jest.Mock<typeof fetch>;

describe('httpCall', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn() as MockFetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should make a successful GET request', async () => {
    const mockData = { id: 1, name: 'Test' };
    (global.fetch as MockFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    const result = await httpCall<typeof mockData>(
      'https://api.example.com',
      '/users/1',
      'GET',
    );

    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/users/1',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('should make a successful POST request with payload', async () => {
    const mockData = { success: true };
    const payload = { name: 'John', active: true };

    (global.fetch as MockFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    const result = await httpCall<typeof mockData>(
      'https://api.example.com',
      '/users',
      'POST',
      payload,
    );

    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    );
  });

  it('should include custom headers', async () => {
    const mockData = { data: 'test' };
    const customHeaders = { Authorization: 'Bearer token123' };

    (global.fetch as MockFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    await httpCall<typeof mockData>(
      'https://api.example.com',
      '/data',
      'GET',
      undefined,
      customHeaders,
    );

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/data',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer token123',
        }),
      }),
    );
  });

  it('should throw error on non-ok response', async () => {
    (global.fetch as MockFetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => 'Not Found',
    } as Response);

    await expect(
      httpCall('https://api.example.com', '/missing', 'GET'),
    ).rejects.toThrow('API Error: 404 - Not Found');
  });

  it('should handle network errors', async () => {
    (global.fetch as MockFetch).mockRejectedValueOnce(
      new Error('Network error'),
    );

    await expect(
      httpCall('https://api.example.com', '/data', 'GET'),
    ).rejects.toThrow('Network error');
  });
});
