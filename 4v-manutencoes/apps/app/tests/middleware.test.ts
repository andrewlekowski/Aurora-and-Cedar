import { describe, it, expect, beforeAll } from 'vitest';
import { onRequest } from '../functions/_middleware';
import { hashPassword, verifyPassword, makeToken, checkToken, RateLimiter, timingSafeEqual } from '../server/auth';

const PASSWORD = 'jacarei autoclave garantia';
const SECRET = 'x'.repeat(40);
let env: { APP_PASSWORD_HASH: string; SESSION_SECRET: string };
beforeAll(async () => { env = { APP_PASSWORD_HASH: await hashPassword(PASSWORD), SESSION_SECRET: SECRET }; });

const STATIC = new Response('<!doctype html><title>app</title>', { status: 200, headers: { 'Content-Type': 'text/html' } });
let ipSeq = 0;
function call(path: string, init: RequestInit & { ip?: string } = {}, e: object = env) {
  const headers = new Headers(init.headers);
  headers.set('CF-Connecting-IP', init.ip || `10.0.0.${++ipSeq}`);
  const request = new Request('https://4v-documentos.pages.dev' + path, { ...init, headers });
  let served = false;
  const next = async () => { served = true; return STATIC.clone(); };
  return onRequest({ request, env: e as never, next }).then(res => ({ res, served }));
}
const login = (password: string, ip?: string) => call('/login', {
  method: 'POST', ip, body: new URLSearchParams({ password }), headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
});
const cookieOf = (res: Response) => (res.headers.get('Set-Cookie') || '').split(';')[0];

describe('password hashing', () => {
  it('verifies the right password and rejects others', async () => {
    expect(env.APP_PASSWORD_HASH).toMatch(/^pbkdf2-sha256\$100000\$/);
    expect(await verifyPassword(PASSWORD, env.APP_PASSWORD_HASH)).toBe(true);
    expect(await verifyPassword('jacarei autoclave', env.APP_PASSWORD_HASH)).toBe(false);
    expect(await verifyPassword(PASSWORD, 'garbage')).toBe(false);
  });
  it('compares in constant time shape', () => {
    expect(timingSafeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 2]))).toBe(true);
    expect(timingSafeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 3]))).toBe(false);
    expect(timingSafeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 2, 0]))).toBe(false);
    expect(timingSafeEqual(new Uint8Array([]), new Uint8Array([1]))).toBe(false);
  });
});

describe('session tokens', () => {
  it('accepts a fresh token and rejects expired, tampered or foreign ones', async () => {
    const tok = await makeToken(SECRET);
    expect(await checkToken(SECRET, tok)).toBe(true);
    expect(await checkToken('y'.repeat(40), tok)).toBe(false); // rotated secret = logged out everywhere
    const [exp, sig] = tok.split('.');
    expect(await checkToken(SECRET, `${Number(exp) + 1}.${sig}`)).toBe(false);
    expect(await checkToken(SECRET, await makeToken(SECRET, Date.now() - 2 * 365 * 864e5))).toBe(false);
    expect(await checkToken(SECRET, '')).toBe(false);
  });
});

describe('middleware', () => {
  it('shows the login page instead of the app without a session', async () => {
    const { res, served } = await call('/', { headers: { Accept: 'text/html' } });
    expect(served).toBe(false);
    expect(res.status).toBe(401);
    expect(res.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    const body = await res.text();
    expect(body).toContain('name="password"');
    expect(body).toContain('Entrar');
  });
  it('never serves app files without a session', async () => {
    for (const p of ['/assets/index-abc.js', '/sw.js', '/garantia']) {
      const { res, served } = await call(p);
      expect(served, p).toBe(false);
      expect(res.status, p).toBe(401);
    }
  });
  it('lets the manifest, icons and robots.txt through (browsers fetch them without cookies)', async () => {
    for (const p of ['/manifest.webmanifest', '/icons/icon-192.png', '/robots.txt']) {
      const { res, served } = await call(p);
      expect(served, p).toBe(true);
      expect(res.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    }
  });
  it('speaks EN and FR on the login page', async () => {
    expect(await (await call('/login?lang=en')).res.text()).toContain('Sign in');
    expect(await (await call('/login', { headers: { 'Accept-Language': 'fr-FR,fr;q=0.9' } })).res.text()).toContain('Mot de passe');
  });
  it('wrong password → 401, right password → 1-year HttpOnly cookie → app is served', async () => {
    const bad = await login('nope');
    expect(bad.res.status).toBe(401);
    expect(await bad.res.text()).toContain('Senha errada');

    const ok = await login(PASSWORD);
    expect(ok.res.status).toBe(303);
    expect(ok.res.headers.get('Location')).toBe('/');
    const sc = ok.res.headers.get('Set-Cookie')!;
    for (const part of ['v4session=', 'HttpOnly', 'Secure', 'SameSite=Lax', 'Max-Age=31536000', 'Path=/']) expect(sc).toContain(part);

    const app = await call('/contrato', { headers: { Cookie: cookieOf(ok.res), Accept: 'text/html' } });
    expect(app.served).toBe(true);
    expect(app.res.status).toBe(200);
    expect(app.res.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');

    const again = await call('/login', { headers: { Cookie: cookieOf(ok.res) } });
    expect(again.res.status).toBe(303);
  });
  it('locks an IP for 5 minutes after 5 wrong passwords, even for the right one', async () => {
    const ip = '192.0.2.77';
    for (let i = 0; i < 4; i++) expect((await login('wrong', ip)).res.status).toBe(401);
    const fifth = await login('wrong', ip);
    expect(fifth.res.status).toBe(429);
    expect(await fifth.res.text()).toContain('Muitas tentativas');
    const right = await login(PASSWORD, ip);
    expect(right.res.status).toBe(429);
    expect(right.res.headers.get('Set-Cookie')).toBeNull();
    expect((await login(PASSWORD, '192.0.2.78')).res.status).toBe(303);
  });
  it('Sair clears the cookie (POST only)', async () => {
    const { res } = await call('/logout', { method: 'POST' });
    expect(res.status).toBe(303);
    expect(res.headers.get('Set-Cookie')).toContain('Max-Age=0');
    expect((await call('/logout')).res.status).toBe(405);
  });
  it('fails closed when the secrets are missing or the secret is too short', async () => {
    for (const e of [{}, { APP_PASSWORD_HASH: env.APP_PASSWORD_HASH, SESSION_SECRET: 'short' }]) {
      const { res, served } = await call('/', { headers: { Accept: 'text/html' } }, e);
      expect(served).toBe(false);
      expect(res.status).toBe(503);
    }
  });
});

describe('RateLimiter', () => {
  it('unlocks after the lock time', () => {
    const r = new RateLimiter(2, 1000);
    r.fail('a', 0); r.fail('a', 0);
    expect(r.lockedFor('a', 500)).toBe(500);
    expect(r.lockedFor('a', 1001)).toBe(0);
  });
});
