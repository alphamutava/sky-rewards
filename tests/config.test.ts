import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Configuration', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgres://localhost:5432/test';
    process.env.NEXTAUTH_SECRET = 'super-secret-key-that-is-at-least-32-chars-long';
  });

  it('should parse environment variables successfully', async () => {
    const { config } = await import('../src/lib/config');
    expect(config.NODE_ENV).toBe('test');
    expect(config.DATABASE_URL).toBe('postgres://localhost:5432/test');
    expect(config.NEXTAUTH_SECRET).toBe('super-secret-key-that-is-at-least-32-chars-long');
  });

  it('should apply defaults for optional fields', async () => {
    const { config } = await import('../src/lib/config');
    expect(config.REDIS_URL).toBe('redis://localhost:6379');
    expect(config.PLATFORM_COMMISSION_PERCENT).toBe('15');
  });
});
