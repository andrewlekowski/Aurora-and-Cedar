/*
 * Password gate for the private document app (HANDOVER §4).
 * Runs on Cloudflare Pages Functions (free) before any file is served. Web Crypto only, no dependencies.
 *
 * Env (encrypted variables in the Pages project, never in the repo):
 *   APP_PASSWORD_HASH  pbkdf2-sha256$<iterations>$<salt b64>$<hash b64>   (npm run hash-password)
 *   SESSION_SECRET     long random string; rotating it logs out every device
 */
export const COOKIE = 'v4session';
export const SESSION_SECONDS = 365 * 24 * 60 * 60; // 1 year: Valdir logs in once per phone
export const MAX_FAILS = 5;
export const LOCK_MS = 5 * 60 * 1000;

const enc = new TextEncoder();
const b64 = (u8: Uint8Array) => btoa(String.fromCharCode(...u8));
const unb64 = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const b64url = (u8: Uint8Array) => b64(u8).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  let diff = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) diff |= (a[i % (a.length || 1)] ?? 0) ^ (b[i % (b.length || 1)] ?? 0);
  return diff === 0;
}

export async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return new Uint8Array(bits);
}

/** Cloudflare Workers allow at most 100,000 PBKDF2 iterations. */
export const ITERATIONS = 100_000;

export async function hashPassword(password: string, salt = crypto.getRandomValues(new Uint8Array(16)), iterations = ITERATIONS) {
  return `pbkdf2-sha256$${iterations}$${b64(salt)}$${b64(await pbkdf2(password, salt, iterations))}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const m = /^pbkdf2-sha256\$(\d+)\$([A-Za-z0-9+/=]+)\$([A-Za-z0-9+/=]+)$/.exec(String(stored || '').trim());
  if (!m) return false;
  const iterations = Number(m[1]);
  if (!(iterations >= 1 && iterations <= ITERATIONS)) return false;
  const got = await pbkdf2(password, unb64(m[2]), iterations);
  return timingSafeEqual(got, unb64(m[3]));
}

async function hmac(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}

/** Token = "<expiry unix seconds>.<HMAC-SHA256 signature, base64url>" */
export async function makeToken(secret: string, nowMs = Date.now(), seconds = SESSION_SECONDS): Promise<string> {
  const exp = Math.floor(nowMs / 1000) + seconds;
  return `${exp}.${b64url(await hmac(secret, `${COOKIE}.${exp}`))}`;
}

export async function checkToken(secret: string, token: string | null | undefined, nowMs = Date.now()): Promise<boolean> {
  const m = /^(\d{1,12})\.([A-Za-z0-9_-]{20,})$/.exec(token || '');
  if (!m) return false;
  if (Number(m[1]) * 1000 <= nowMs) return false;
  const want = enc.encode(b64url(await hmac(secret, `${COOKIE}.${m[1]}`)));
  return timingSafeEqual(enc.encode(m[2]), want);
}

export function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}

export const sessionCookie = (token: string) => `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_SECONDS}`;
export const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

/** Simple per-isolate failure counter (good enough on the free plan). */
export class RateLimiter {
  private hits = new Map<string, { fails: number; until: number }>();
  constructor(private max = MAX_FAILS, private lockMs = LOCK_MS) {}
  lockedFor(ip: string, now = Date.now()): number {
    const h = this.hits.get(ip);
    if (!h || h.until <= now) { if (h && h.until && h.until <= now) this.hits.delete(ip); return 0; }
    return h.until - now;
  }
  fail(ip: string, now = Date.now()) {
    const h = this.hits.get(ip) || { fails: 0, until: 0 };
    h.fails += 1;
    if (h.fails >= this.max) { h.until = now + this.lockMs; h.fails = 0; }
    this.hits.set(ip, h);
    if (this.hits.size > 5000) this.hits.clear();
  }
  ok(ip: string) { this.hits.delete(ip); }
}
