// SEO / content checks over the built site (dist/). Run after `astro build`. Exits 1 on any failure.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_URL, APP_URL, BUSINESS } from '../../../packages/brand/site.config.ts';

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) { if (f !== '_astro') walk(p); } else if (f.endsWith('.html')) files.push(p); } })(dist);

const errors = [];
const warn = [];
const fail = (f, m) => errors.push(`${path.relative(dist, f)}: ${m}`);
const decode = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const one = (html, re) => { const m = re.exec(html); return m ? decode(m[1]) : null; };
const urlOf = f => { let r = '/' + path.relative(dist, f).replace(/\\/g, '/').replace(/\.html$/, ''); if (r === '/index') r = '/'; return SITE_URL + (r === '/' ? '/' : r); };

const titles = new Map(), descs = new Map(), canon = new Map(), alts = new Map();
let totalJs = 0;

for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  const rel = path.relative(dist, f);
  const is404 = rel === '404.html';
  const noindex = /<meta name="robots" content="noindex/.test(html);
  const title = one(html, /<title>([^<]*)<\/title>/);
  const desc = one(html, /<meta name="description" content="([^"]*)"/);
  if (!title) fail(f, 'missing <title>');
  else if ([...title].length > 60) fail(f, `title ${[...title].length} chars > 60: ${title}`);
  if (!desc) fail(f, 'missing meta description');
  else if ([...desc].length > 155) fail(f, `description ${[...desc].length} chars > 155`);
  if (!noindex) {
    if (titles.has(title)) fail(f, `duplicate title with ${titles.get(title)}`); else titles.set(title, rel);
    if (descs.has(desc)) fail(f, `duplicate description with ${descs.get(desc)}`); else descs.set(desc, rel);
  }
  const h1s = html.match(/<h1[\s>]/g) || [];
  if (h1s.length !== 1) fail(f, `${h1s.length} <h1> elements`);
  if (!/<html lang="(pt-BR|en|fr)"/.test(html)) fail(f, 'missing html lang');
  if (html.includes(APP_URL) || /4v-documentos/.test(html)) fail(f, 'links to the private document app');
  if (!html.includes(`https://wa.me/${BUSINESS.whatsappDigits}?text=`)) fail(f, 'no prefilled WhatsApp link');
  if (!html.includes(`mailto:${BUSINESS.email}?subject=`)) fail(f, 'no mailto link with subject');
  if (!html.includes(BUSINESS.email)) fail(f, 'e-mail not shown as text');
  if (/\b(CREA|certificad[oa]|certified|certifié|depoimento|testimonial|R\$\s?\d)/i.test(html.replace(/<script[\s\S]*?<\/script>/g, ''))) fail(f, 'possible unconfirmed claim (certification/testimonial/price)');
  for (const m of html.matchAll(/<script(?![^>]*type="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/g)) totalJs = Math.max(totalJs, m[1].length);
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch (e) { fail(f, 'invalid JSON-LD'); } }
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt(=|\s|>)/.test(m[0])) fail(f, `img without alt: ${m[0].slice(0, 80)}`);
    if (!/\bwidth="/.test(m[0]) || !/\bheight="/.test(m[0])) fail(f, `img without width/height: ${m[0].slice(0, 80)}`);
  }
  if (is404 || noindex) continue;
  const c = one(html, /<link rel="canonical" href="([^"]*)"/);
  if (c !== urlOf(f)) fail(f, `canonical ${c} != ${urlOf(f)}`);
  canon.set(urlOf(f), f);
  const a = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map(m => [m[1], m[2]]);
  if (a.length !== 4 || !a.some(x => x[0] === 'x-default')) fail(f, `expected 4 hreflang links, got ${a.length}`);
  alts.set(urlOf(f), a);
  if (!html.includes('application/ld+json')) fail(f, 'no JSON-LD');
  if (!html.includes('"LocalBusiness"')) fail(f, 'no LocalBusiness JSON-LD');
  if (urlOf(f) !== SITE_URL + '/' && !/\/(en|fr)$/.test(urlOf(f)) && !html.includes('"BreadcrumbList"')) fail(f, 'inner page without BreadcrumbList');
}

// hreflang reciprocity and targets exist
for (const [u, a] of alts) {
  for (const [, href] of a) {
    if (!canon.has(href)) errors.push(`${u}: hreflang target ${href} is not a canonical page`);
    else if (!alts.get(href).some(x => x[1] === u)) errors.push(`${u}: ${href} does not link back`);
  }
}

// word count on PT service pages (HANDOVER §6.2: 400–700 words of real content)
const svc = files.filter(f => /^manutencao-|^instalacao-/.test(path.basename(f)));
for (const f of svc) {
  const main = /<main[\s\S]*?<\/main>/.exec(fs.readFileSync(f, 'utf8'))[0].replace(/<form[\s\S]*?<\/form>/g, '').replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ');
  const words = decode(main).split(/\s+/).filter(w => /\p{L}/u.test(w)).length;
  if (words < 400 || words > 700) warn.push(`${path.basename(f)}: ${words} words (target 400–700)`);
  else console.log(`ok  ${path.basename(f)}: ${words} words`);
}
if (totalJs > 15000) errors.push(`inline JS ${totalJs} bytes > 15 KB budget`);
const extJs = fs.existsSync(path.join(dist, '_astro')) ? fs.readdirSync(path.join(dist, '_astro')).filter(f => f.endsWith('.js')) : [];
if (extJs.length) errors.push(`unexpected JS bundles shipped: ${extJs.join(', ')}`);

console.log(`\nchecked ${files.length} pages · inline JS max ${totalJs} bytes · ${titles.size} unique titles`);
warn.forEach(w => console.log('warn ' + w));
if (errors.length) { console.error('\n' + errors.map(e => 'FAIL ' + e).join('\n')); process.exit(1); }
console.log('all content checks passed');
