import { describe, it, expect } from 'vitest';
import { extenso, parseMoney, fmtBRL } from '../src/money.js';

// Cases from prototype/SPEC.md ("Amount in words").
const CASES = {
  pt: {
    0.5: 'cinquenta centavos', 1: 'um real', 2: 'dois reais', 21: 'vinte e um reais', 71: 'setenta e um reais',
    80: 'oitenta reais', 81: 'oitenta e um reais', 99: 'noventa e nove reais', 100: 'cem reais', 101: 'cento e um reais',
    200: 'duzentos reais', 201: 'duzentos e um reais', 1000: 'mil reais', 1005: 'mil e cinco reais',
    1200: 'mil e duzentos reais', 1250: 'mil duzentos e cinquenta reais',
    2345.6: 'dois mil trezentos e quarenta e cinco reais e sessenta centavos',
    1000000: 'um milhão de reais', 2500000: 'dois milhões e quinhentos mil reais',
  },
  en: {
    0.5: 'fifty centavos', 1: 'one real', 2: 'two reais', 21: 'twenty-one reais', 71: 'seventy-one reais',
    80: 'eighty reais', 81: 'eighty-one reais', 99: 'ninety-nine reais', 100: 'one hundred reais', 101: 'one hundred one reais',
    200: 'two hundred reais', 201: 'two hundred one reais', 1000: 'one thousand reais', 1005: 'one thousand five reais',
    1200: 'one thousand two hundred reais', 1250: 'one thousand two hundred fifty reais',
    2345.6: 'two thousand three hundred forty-five reais and sixty centavos',
    1000000: 'one million reais', 2500000: 'two million five hundred thousand reais',
  },
  fr: {
    0.5: 'cinquante centavos', 1: 'un réal', 2: 'deux reais', 21: 'vingt et un reais', 71: 'soixante et onze reais',
    80: 'quatre-vingts reais', 81: 'quatre-vingt-un reais', 99: 'quatre-vingt-dix-neuf reais', 100: 'cent reais', 101: 'cent un reais',
    200: 'deux cents reais', 201: 'deux cent un reais', 1000: 'mille reais', 1005: 'mille cinq reais',
    1200: 'mille deux cents reais', 1250: 'mille deux cent cinquante reais',
    2345.6: 'deux mille trois cent quarante-cinq reais et soixante centavos',
    1000000: 'un million de reais', 2500000: 'deux millions cinq cent mille reais',
  },
};

describe('extenso()', () => {
  for (const [lang, cases] of Object.entries(CASES)) {
    describe(lang, () => {
      for (const [value, words] of Object.entries(cases)) {
        it(`${value} → ${words}`, () => expect(extenso(Number(value), lang)).toBe(words));
      }
    });
  }
  it('handles one centavo and zero', () => {
    expect(extenso(0.01, 'pt')).toBe('um centavo');
    expect(extenso(0, 'pt')).toBe('zero reais');
    expect(extenso(0, 'fr')).toBe('zéro réal');
  });
  it('French plural rules inside thousands', () => {
    expect(extenso(80000, 'fr')).toBe('quatre-vingt mille reais');
    expect(extenso(200000, 'fr')).toBe('deux cent mille reais');
  });
  it('returns empty string for invalid input', () => {
    expect(extenso(-1, 'pt')).toBe('');
    expect(extenso(NaN, 'pt')).toBe('');
    expect(extenso(10, 'de')).toBe('');
  });
});

describe('parseMoney()', () => {
  const ok = {
    '1200': 1200, '1.200,00': 1200, '1.200': 1200, '1200,5': 1200.5, '1200.50': 1200.5,
    'R$ 2.345,60': 2345.6, '1.234.567': 1234567, '0,50': 0.5, ' 99 ': 99,
  };
  for (const [s, v] of Object.entries(ok)) it(`"${s}" → ${v}`, () => expect(parseMoney(s)).toBe(v));
  for (const s of ['', 'abc', null, undefined, '.,']) it(`"${s}" → NaN`, () => expect(parseMoney(s)).toBeNaN());
});

describe('fmtBRL()', () => {
  it('formats with Brazilian separators', () => {
    expect(fmtBRL(1200)).toBe('1.200,00');
    expect(fmtBRL(2345.6)).toBe('2.345,60');
    expect(fmtBRL(0.5)).toBe('0,50');
    expect(fmtBRL(1234567.891)).toBe('1.234.567,89');
  });
});
