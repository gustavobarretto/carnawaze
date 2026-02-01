import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';

const TEST_CONFIG = {
  DATABASE_URL: process.env.DATABASE_URL ?? 'file:./e2e.sqlite',
  JWT_SECRET: process.env.JWT_SECRET ?? 'a'.repeat(32),
  PORT: 0,
  NODE_ENV: 'test' as const,
  CORS_ORIGIN: '*',
};

describe('API E2E', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let baseUrl: string;
  let token: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_CONFIG.DATABASE_URL;
    process.env.JWT_SECRET = TEST_CONFIG.JWT_SECRET;
    app = await buildApp(TEST_CONFIG);
    await app.listen({ port: 0, host: '127.0.0.1' });
    const addr = app.server.address();
    const port = typeof addr === 'object' && addr?.port ? addr.port : 3001;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('POST /v1/users creates user and returns token', async () => {
    const res = await fetch(`${baseUrl}/v1/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `e2e-${Date.now()}@test.com`,
        name: 'E2E User',
        password: 'password123',
      }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.user).toBeTruthy();
    expect(data.token).toBeTruthy();
    token = data.token;
  });

  it('POST /v1/auth/login returns token', async () => {
    const email = `login-${Date.now()}@test.com`;
    await fetch(`${baseUrl}/v1/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name: 'Login User', password: 'pass123' }),
    });
    const res = await fetch(`${baseUrl}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'pass123' }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.token).toBeTruthy();
  });

  it('GET /v1/users/me requires auth', async () => {
    const res = await fetch(`${baseUrl}/v1/users/me`);
    expect(res.status).toBe(401);
  });

  it('GET /v1/users/me returns user when authenticated', async () => {
    const email = `me-${Date.now()}@test.com`;
    const reg = await fetch(`${baseUrl}/v1/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name: 'Me User', password: 'pass123' }),
    });
    const { token: t } = await reg.json();
    const res = await fetch(`${baseUrl}/v1/users/me`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.email).toBe(email);
  });

  it('GET /v1/pins returns 401 without auth', async () => {
    const res = await fetch(`${baseUrl}/v1/pins`);
    expect(res.status).toBe(401);
  });

  it('GET /v1/pins returns pins when authenticated', async () => {
    const email = `pins-${Date.now()}@test.com`;
    const reg = await fetch(`${baseUrl}/v1/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name: 'Pins User', password: 'pass123' }),
    });
    const { token: t } = await reg.json();
    const res = await fetch(`${baseUrl}/v1/pins`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.pins)).toBe(true);
  });
});
