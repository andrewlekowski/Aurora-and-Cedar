// Public site at 390×844: every page in PT/EN/FR.
import { test, expect } from '@playwright/test';
import { ROUTES, CONTENT, pathFor } from '../src/lib/site.ts';
import { BUSINESS } from '../../../packages/brand/site.config.ts';

for (const r of ROUTES) {
  test(`${r.path} renders on a phone`, async ({ page }) => {
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push(String(e)));
    const res = await page.goto(r.path);
    expect(res.status()).toBe(200);
    expect(page.url()).toBe(new URL(r.path, 'http://localhost:8789').href);
    await expect(page.locator('h1')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    // sticky bar with both contact paths
    const bar = page.locator('.bar');
    await expect(bar.getByRole('link', { name: 'WhatsApp' })).toBeVisible();
    await expect(bar.getByRole('link', { name: 'E-mail' })).toBeVisible();
    // tap targets
    const small = await page.locator('main .btn:visible, .bar .btn, .langs a:visible, .menu summary').evaluateAll(els => els.filter(e => { const b = e.getBoundingClientRect(); return b.height < 44 || b.width < 44; }).map(e => e.textContent));
    expect(small).toEqual([]);
    expect(await page.evaluate(() => getComputedStyle(document.body).fontSize)).toBe('19px');
    expect(errors).toEqual([]);
  });
}

test('language switch keeps the same page', async ({ page }) => {
  await page.goto(pathFor('pt', 'autoclave'));
  // On a 390px phone the switch lives in the menu.
  await expect(page.locator('.top .wide-only')).toBeHidden();
  await page.locator('.menu summary').click();
  await page.locator('.menu-langs a', { hasText: 'Français' }).click();
  await expect(page).toHaveURL(/\/fr\/maintenance-autoclave$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await page.locator('.foot-langs a', { hasText: 'English' }).click();
  await expect(page).toHaveURL(/\/en\/autoclave-maintenance$/);
});

test('menu opens and lists every service', async ({ page }) => {
  await page.goto('/');
  await page.locator('.menu summary').click();
  const links = page.locator('.menu nav ul a');
  await expect(links).toHaveCount(11);
  await links.filter({ hasText: 'Experiência' }).click();
  await expect(page).toHaveURL(/\/experiencia$/);
});

test('WhatsApp link is prefilled per page, e-mail has a subject', async ({ page }) => {
  await page.goto(pathFor('pt', 'autoclave'));
  const wa = await page.locator('main a.btn.primary').first().getAttribute('href');
  expect(decodeURIComponent(wa)).toBe(`https://wa.me/${BUSINESS.whatsappDigits}?text=${CONTENT.pt.services.autoclave.waText}`);
  const mail = await page.locator('main a[href^="mailto:"]').first().getAttribute('href');
  expect(decodeURIComponent(mail)).toBe(`mailto:${BUSINESS.email}?subject=Orçamento – manutenção de autoclave`);
});

test('quote form posts to Web3Forms with honeypot, redirect and a too-fast guard', async ({ page }) => {
  await page.goto(pathFor('pt', 'contato'));
  const form = page.locator('form.quote');
  await expect(form).toHaveAttribute('action', 'https://api.web3forms.com/submit');
  await expect(form.locator('input[name=redirect]')).toHaveValue('https://4vmanutencoes.pages.dev/obrigado');
  await expect(form.locator('input[name=botcheck]')).toHaveCount(1);
  for (const l of ['Nome', 'Empresa ou instituição', 'Cidade', 'Telefone ou WhatsApp', 'E-mail', 'Equipamento (marca e modelo)', 'Mensagem']) await expect(page.getByLabel(l, { exact: false }).first()).toBeVisible();
  let posted = false;
  await page.route('https://api.web3forms.com/**', route => { posted = true; route.fulfill({ status: 303, headers: { Location: 'http://localhost:8789/obrigado' } }); });
  await page.getByLabel(/^Nome/).fill('Teste');
  await page.getByLabel(/^Telefone/).fill('12 99999-0000');
  await page.getByLabel(/^Mensagem/).fill('Autoclave não pressuriza');
  await page.getByRole('button', { name: 'Enviar mensagem' }).click();
  await expect(page.locator('.form-msg')).toContainText('Confira os dados');
  expect(posted).toBe(false);
  await page.waitForTimeout(3100);
  await page.getByRole('button', { name: 'Enviar mensagem' }).click();
  await expect(page).toHaveURL(/\/obrigado$/);
  expect(posted).toBe(true);
  await expect(page.locator('h1')).toHaveText('Mensagem enviada');
});

test('service pages carry Service, FAQPage and BreadcrumbList JSON-LD', async ({ page }) => {
  await page.goto(pathFor('en', 'odonto'));
  const types = await page.locator('script[type="application/ld+json"]').evaluateAll(s => s.map(x => JSON.parse(x.textContent)['@type']).flat());
  expect(types).toEqual(expect.arrayContaining(['LocalBusiness', 'BreadcrumbList', 'Service', 'FAQPage']));
});

test('unknown URL returns the 404 page', async ({ page }) => {
  const res = await page.goto('/nao-existe');
  expect(res.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('Página não encontrada');
});

test('vCard downloads with the business details', async ({ request }) => {
  const res = await request.get('/4V_Manutencoes.vcf');
  expect(res.status()).toBe(200);
  const body = await res.text();
  expect(body).toContain('FN:4V Manutencoes');
  expect(body).toContain(`waid=${BUSINESS.whatsappDigits}`);
  expect(body).toContain(`EMAIL;TYPE=INTERNET:${BUSINESS.email}`);
});
