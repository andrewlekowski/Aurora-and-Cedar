// Renders public/og.jpg (1200×630, black & white) with the real fonts and logo. Run: npm run og -w @4v/site
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BUSINESS } from '../../../packages/brand/site.config.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const brand = path.resolve(here, '../../../packages/brand');
const b64 = f => fs.readFileSync(path.join(brand, f)).toString('base64');
const html = `<!doctype html><html><head><style>
@font-face{font-family:A;src:url(data:font/woff2;base64,${b64('fonts/archivo-latin-wght-normal.woff2')}) format('woff2');font-weight:100 900}
@font-face{font-family:H;src:url(data:font/woff2;base64,${b64('fonts/atkinson-hyperlegible-latin-700-normal.woff2')}) format('woff2');font-weight:700}
body{margin:0;width:1200px;height:630px;background:#fff;color:#0a0a0a;overflow:hidden;position:relative;font-family:H}
.wm{position:absolute;right:-40px;top:-10px;width:650px;opacity:.15}
.box{position:absolute;left:80px;top:90px;right:420px}
h1{font:800 104px/1 A;margin:0 0 18px;letter-spacing:-.02em}
.sub{font:800 34px/1.2 A;margin:0 0 34px}
.l{font-size:30px;line-height:1.35;margin:0}
.c{position:absolute;left:80px;bottom:70px;font-size:30px;border-top:4px solid #0a0a0a;padding-top:18px;right:80px}
</style></head><body><img class="wm" src="data:image/png;base64,${b64('assets/logo_k.png')}">
<div class="box"><h1>${BUSINESS.name}</h1><p class="sub">${BUSINESS.subtitle}</p>
<p class="l">Manutenção de equipamentos médicos, laboratoriais e odontológicos</p></div>
<div class="c">WhatsApp ${BUSINESS.phoneDisplay} · Garantia mínima de 3 meses</div></body></html>`;
const b = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.setContent(html);
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: path.resolve(here, '../public/og.jpg'), type: 'jpeg', quality: 85 });
await b.close();
console.log('wrote public/og.jpg');
