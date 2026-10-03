import { describe, it, expect } from 'vitest';
import { buildBlocks, blocksHTML, blocksText, docFilename, presetOrient, presetText, DOC_TYPES, LANGS, CO_DEF } from '../src/index.js';
import { CO, FULL, EMPTY } from './fixtures.js';

describe('document builders: block snapshots', () => {
  for (const type of DOC_TYPES) {
    for (const lang of LANGS) {
      it(`${type} / ${lang} / full data`, () => expect(buildBlocks(type, FULL[type], lang, CO)).toMatchSnapshot());
    }
    it(`${type} / pt / empty data`, () => expect(buildBlocks(type, EMPTY[type], 'pt', CO)).toMatchSnapshot());
  }
});

describe('fill-by-hand lines', () => {
  it('empty fields print as underscores', () => {
    const txt = blocksText(buildBlocks('recibo', EMPTY.recibo, 'pt', CO), 'pt', CO);
    expect(txt).toMatch(/Recebi de \*_{30}\*/);
    expect(txt).toContain('R$ __________');
  });
  it('garantia without parts prints three blank rows', () => {
    const t = buildBlocks('garantia', EMPTY.garantia, 'pt', CO).find(b => b.t === 'table');
    expect(t.rows).toEqual([['', ''], ['', ''], ['', '']]);
  });
});

describe('warranty wording', () => {
  it('defaults to 3 months and says warranty service is free', () => {
    for (const type of ['garantia', 'entrega', 'contrato']) {
      const txt = blocksText(buildBlocks(type, EMPTY[type], 'pt', CO), 'pt', CO);
      expect(txt).toContain('3 (três) meses');
      expect(txt).toMatch(/não tem custo/);
    }
  });
});

describe('contract', () => {
  it('writes the amount in words in each language', () => {
    const words = { pt: 'mil e duzentos reais', en: 'one thousand two hundred reais', fr: 'mille deux cents reais' };
    for (const lang of LANGS) expect(blocksText(buildBlocks('contrato', FULL.contrato, lang, CO), lang, CO)).toContain(words[lang]);
  });
});

describe('renderers', () => {
  it('HTML escapes user input but keeps **bold**', () => {
    const S = { ...FULL.recibo, cli_name: '<script>x</script>' };
    const html = blocksHTML(buildBlocks('recibo', S, 'pt', CO), 'pt', CO, '/logo.png');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('<b>R$ 2.345,60 (dois mil trezentos e quarenta e cinco reais e sessenta centavos)</b>');
  });
  it('header shows the address only when enabled', () => {
    const b = buildBlocks('recibo', FULL.recibo, 'pt', CO);
    expect(blocksText(b, 'pt', CO)).not.toContain('Rua São Marcos');
    expect(blocksText(b, 'pt', { ...CO, showaddr: true })).toContain('Rua São Marcos, 126');
  });
});

describe('helpers', () => {
  it('docFilename translates prefix and sanitizes client name', () => {
    expect(docFilename('garantia', FULL.garantia, 'pt', 'pdf')).toBe('Termo-de-Garantia-G-2026-007-Clinica-Exemplo-Ltda.pdf');
    expect(docFilename('recibo', EMPTY.recibo, 'en', 'docx')).toMatch(/^Receipt-R-2026-001\.docx$/);
  });
  it('every orientation preset ends with seal + contact items', () => {
    for (const tipo of ['autoclave', 'odonto', 'estufa', 'exaustao', 'bio', 'outro', 'unknown']) {
      const items = presetOrient(tipo);
      expect(items.slice(-2).map(i => i.key)).toEqual(['selo', 'contato']);
      for (const lang of LANGS) for (const i of items) expect(presetText(i.key, lang, CO_DEF)).not.toBe('');
    }
  });
});
