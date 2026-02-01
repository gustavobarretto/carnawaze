import { createHmac, randomBytes } from 'node:crypto';

const ALG = 'HS256';
const TTL_SEC = 60 * 60 * 24 * 7; // 7 days

function base64UrlEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Buffer {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  return Buffer.from(b64, 'base64');
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export function signJwt(secret: string, payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  const header = { alg: ALG, typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JwtPayload = { ...payload, iat: now, exp: now + TTL_SEC };
  const headerB64 = base64UrlEncode(Buffer.from(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(Buffer.from(JSON.stringify(fullPayload)));
  const signatureInput = `${headerB64}.${payloadB64}`;
  const sig = createHmac('sha256', secret).update(signatureInput).digest();
  return `${signatureInput}.${base64UrlEncode(sig)}`;
}

export function verifyJwt(secret: string, token: string): JwtPayload {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT');
  const [headerB64, payloadB64, sigB64] = parts;
  const signatureInput = `${headerB64}.${payloadB64}`;
  const expectedSig = base64UrlEncode(createHmac('sha256', secret).update(signatureInput).digest());
  if (expectedSig !== sigB64) throw new Error('Invalid JWT signature');
  const payload = JSON.parse(base64UrlDecode(payloadB64).toString()) as JwtPayload;
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error('JWT expired');
  return payload;
}

export function randomToken(): string {
  return randomBytes(32).toString('hex');
}

const ALPHANUMERIC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Código alfanumérico para confirmação de e-mail (sem 0/O e 1/I para evitar confusão). */
export function randomAlphanumericCode(length: number): string {
  let out = '';
  const bytes = randomBytes(length);
  for (let i = 0; i < length; i++) out += ALPHANUMERIC[bytes[i]! % ALPHANUMERIC.length];
  return out;
}
