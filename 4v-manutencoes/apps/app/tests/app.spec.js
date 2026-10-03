// Mobile run (390×844) of the built app, served by `vite preview` (the password gate is tested separately).
import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const VIEWS = ['/', '/garantia', '/entrega', '/contrato', '/recibo', '/clientes', '/dados'];

function watchErrors(page) {
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  return errors;
}
const noHScroll = page => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

async function fillContract(page) {
  await page.goto('/contrato');
  await page.fill('#f-cli_name', 'Clínica Exemplo Ltda');
  await page.check('#f-cli_type-1', { force: true });
  await page.fill('#f-cli_doc', '12.345.678/0001-90');
  await page.fill('#f-cli_addr', 'Rua das Flores, 100 – Centro');
  await page.fill('#f-cli_city', 'São José dos Campos – SP');
  await page.fill('#f-cli_rep', 'Ana Souza, CPF 123.456.789-00');
  await page.fill('#f-items-0-desc', 'Autoclave Sercon 21 litros');
  await page.fill('#f-items-0-serial', 'SN12345');
  await page.fill('#f-valor', '1.200,00');
  await expect(page.locator('#f-extenso')).toHaveText('mil e duzentos reais');
  await expect(page.locator('#paper-sizer')).toContainText('mil e duzentos reais', { timeout: 3000 });
}

test('every view renders at 390px with no horizontal scroll and no console errors', async ({ page }) => {
  const errors = watchErrors(page);
  for (const lang of ['PT', 'EN', 'FR']) {
    for (const v of VIEWS) {
      await page.goto(v);
      if (lang !== 'PT') await page.getByRole('button', { name: lang, exact: true }).click();
      await expect(page.locator('#app')).not.toBeEmpty();
      expect(await noHScroll(page), `${lang} ${v}`).toBe(true);
      const small = await page.locator('main .btn:visible').evaluateAll(els => els.filter(e => e.getBoundingClientRect().height < 48).length);
      expect(small, `buttons under 48px on ${v}`).toBe(0);
    }
    await page.getByRole('button', { name: 'PT', exact: true }).click();
  }
  expect(errors).toEqual([]);
});

test('home links route without reloading and back button works', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => { window.__noReload = true; });
  await page.getByRole('link', { name: /Termo de Garantia/ }).click();
  await expect(page).toHaveURL(/\/garantia$/);
  await expect(page.locator('h1.h1')).toHaveText('Termo de Garantia');
  expect(await page.evaluate(() => window.__noReload)).toBe(true);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.hero-home')).toBeVisible();
});

test('contract: PDF and Word downloads are non-empty', async ({ page }, info) => {
  const errors = watchErrors(page);
  await page.addInitScript(() => { window.__blobs = {}; window.__testBlob = (k, b, n) => { window.__blobs[k] = { size: b.size, name: n }; }; });
  await fillContract(page);

  const [pdf] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.locator('#btn-main').click()]);
  expect(pdf.suggestedFilename()).toMatch(/^Contrato-de-Venda-C-\d{4}-\d{3}-Clinica-Exemplo-Ltda\.pdf$/);
  const pdfPath = info.outputPath('contrato.pdf');
  await pdf.saveAs(pdfPath);
  const head = fs.readFileSync(pdfPath).subarray(0, 5).toString();
  expect(head).toBe('%PDF-');
  expect(fs.statSync(pdfPath).size).toBeGreaterThan(20000);
  await expect(page.locator('.prev-col .st-line')).toHaveText('Arquivo baixado. Ele está na pasta Downloads.');

  const [docx] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.locator('#btn-docx').click()]);
  expect(docx.suggestedFilename()).toMatch(/\.docx$/);
  const docxPath = info.outputPath('contrato.docx');
  await docx.saveAs(docxPath);
  expect(fs.readFileSync(docxPath).subarray(0, 2).toString()).toBe('PK');
  expect(fs.statSync(docxPath).size).toBeGreaterThan(5000);

  const blobs = await page.evaluate(() => window.__blobs);
  expect(blobs.pdf.size).toBeGreaterThan(20000);
  expect(blobs.docx.size).toBeGreaterThan(5000);
  expect(await noHScroll(page)).toBe(true);
  expect(errors).toEqual([]);
});

test('Enviar pelo WhatsApp shares the PDF, with a second tap if the phone asks for one', async ({ page }) => {
  await page.addInitScript(() => {
    window.__shared = [];
    let first = true;
    navigator.canShare = d => !!(d && d.files && d.files.length);
    navigator.share = async d => {
      if (first) { first = false; throw new DOMException('activation expired', 'NotAllowedError'); }
      window.__shared.push({ name: d.files[0].name, type: d.files[0].type, size: d.files[0].size, title: d.title });
    };
  });
  await page.goto('/recibo');
  await page.fill('#f-cli_name', 'João da Silva');
  await page.fill('#f-valor', '350');
  await expect(page.locator('#btn-main')).toHaveText('Enviar pelo WhatsApp');
  await expect(page.locator('#bar-main')).toHaveText('Enviar pelo WhatsApp');
  await page.locator('#bar-main').click();
  const again = page.getByRole('button', { name: 'Enviar agora' });
  await expect(again).toBeVisible({ timeout: 30000 });
  await again.click();
  await expect(page.locator('.prev-col .st-line')).toHaveText('Pronto.');
  const shared = await page.evaluate(() => window.__shared);
  expect(shared).toHaveLength(1);
  expect(shared[0].type).toBe('application/pdf');
  expect(shared[0].name).toMatch(/^Recibo-R-\d{4}-\d{3}-Joao-da-Silva\.pdf$/);
  expect(shared[0].size).toBeGreaterThan(10000);
});

test('drafts and saved clients survive a reload; backup and restore round-trip', async ({ page }, info) => {
  await page.goto('/garantia');
  await page.fill('#f-cli_name', 'Hospital Teste');
  await page.fill('#f-cli_city', 'Jacareí – SP');
  await page.getByRole('button', { name: 'Salvar este cliente' }).click();
  await expect(page.locator('#cli-status')).toHaveText('Cliente salvo.');
  await page.reload();
  await expect(page.locator('#f-cli_name')).toHaveValue('Hospital Teste');

  await page.goto('/dados');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Fazer cópia de segurança' }).click()]);
  const backup = info.outputPath('backup.json');
  await dl.saveAs(backup);
  expect(JSON.parse(fs.readFileSync(backup, 'utf8')).data.clients[0].cli_name).toBe('Hospital Teste');

  await page.evaluate(() => localStorage.clear());
  await page.goto('/clientes');
  await expect(page.locator('.cl')).toHaveCount(0);

  await page.goto('/dados');
  await page.setInputFiles('#bk-file', { name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"x":1}') });
  await expect(page.locator('#bk-status')).toHaveText('Este arquivo não é uma cópia do 4V Documentos.');
  await page.setInputFiles('#bk-file', backup);
  await page.getByRole('button', { name: 'Sim' }).click();
  await expect(page.locator('#bk-status')).toHaveText('Cópia restaurada.');
  await page.goto('/clientes');
  await expect(page.locator('.cl b')).toHaveText('Hospital Teste');
});

test('entrega: changing equipment type reloads the orientation presets', async ({ page }) => {
  await page.goto('/entrega');
  await expect(page.locator('#paper-sizer .d-ol li').first()).toContainText('Acompanhe o equipamento durante o ciclo');
  await page.selectOption('#f-tipo', 'estufa');
  await expect(page.locator('#paper-sizer .d-ol li').first()).toContainText('Ligue o equipamento somente na tensão');
  await expect(page.locator('#paper-sizer .d-ol li').last()).toContainText('WhatsApp (12) 99788-1836');
});

test('install card can be dismissed for good', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#install')).toBeVisible();
  await page.getByRole('button', { name: 'Já fiz. Fechar.' }).click();
  await expect(page.locator('#install')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('#install')).toHaveCount(0);
});
