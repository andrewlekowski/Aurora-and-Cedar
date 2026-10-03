/* Cloudflare Pages Functions middleware: nothing in the document app is served without a valid session. */
import {
  RateLimiter, checkToken, clearCookie, makeToken, readCookie, sessionCookie, verifyPassword, COOKIE,
} from '../server/auth';
import { loginPage, pickLang, type LoginMsg } from '../server/login-page';

interface Env { APP_PASSWORD_HASH?: string; SESSION_SECRET?: string }
interface Ctx { request: Request; env: Env; next: (input?: Request | string) => Promise<Response> }

const limiter = new RateLimiter();
/** Files that must load before login (the browser fetches the manifest and icons without cookies). */
const PUBLIC = /^\/(manifest\.webmanifest|robots\.txt|favicon\.ico|icons\/[\w.-]+)$/;

const NOINDEX = 'noindex, nofollow';
function withHeaders(res: Response, extra: Record<string, string> = {}): Response {
  const r = new Response(res.body, res);
  r.headers.set('X-Robots-Tag', NOINDEX);
  for (const [k, v] of Object.entries(extra)) r.headers.set(k, v);
  return r;
}
const html = (body: string, status = 200, headers: Record<string, string> = {}) =>
  new Response(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': NOINDEX, 'X-Frame-Options': 'DENY', ...headers } });
const redirect = (to: string, cookie?: string) =>
  new Response(null, { status: 303, headers: { Location: to, 'Cache-Control': 'no-store', 'X-Robots-Tag': NOINDEX, ...(cookie ? { 'Set-Cookie': cookie } : {}) } });

export async function onRequest(ctx: Ctx): Promise<Response> {
  const { request, env } = ctx;
  const url = new URL(request.url);
  const path = url.pathname;
  const lang = pickLang(url, request.headers.get('Accept-Language'));
  const configured = !!(env.APP_PASSWORD_HASH && env.SESSION_SECRET && env.SESSION_SECRET.length >= 32);

  if (PUBLIC.test(path) && (request.method === 'GET' || request.method === 'HEAD')) return withHeaders(await ctx.next());

  if (path === '/logout') {
    if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST', 'X-Robots-Tag': NOINDEX } });
    return redirect('/login', clearCookie());
  }

  if (!configured) return html(loginPage(lang, 'config'), 503);

  if (path === '/login') {
    if (request.method === 'POST') {
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      const wait = limiter.lockedFor(ip);
      if (wait > 0) return html(loginPage(lang, 'locked', Math.ceil(wait / 60000)), 429, { 'Retry-After': String(Math.ceil(wait / 1000)) });
      let password = '';
      try { const form = await request.formData(); password = String(form.get('password') || ''); } catch { /* empty */ }
      if (password && password.length <= 256 && await verifyPassword(password, env.APP_PASSWORD_HASH!)) {
        limiter.ok(ip);
        return redirect('/', sessionCookie(await makeToken(env.SESSION_SECRET!)));
      }
      limiter.fail(ip);
      const after = limiter.lockedFor(ip);
      const msg: LoginMsg = after > 0 ? 'locked' : 'wrong';
      return html(loginPage(lang, msg, Math.ceil(after / 60000) || 5), after > 0 ? 429 : 401);
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, POST', 'X-Robots-Tag': NOINDEX } });
    if (await checkToken(env.SESSION_SECRET!, readCookie(request.headers.get('Cookie'), COOKIE))) return redirect('/');
    return html(loginPage(lang));
  }

  if (await checkToken(env.SESSION_SECRET!, readCookie(request.headers.get('Cookie'), COOKIE))) {
    return withHeaders(await ctx.next());
  }

  const wantsHtml = request.method === 'GET' && (request.headers.get('Accept') || '').includes('text/html');
  if (wantsHtml) return html(loginPage(lang), 401);
  return new Response('Unauthorized', { status: 401, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': NOINDEX } });
}
