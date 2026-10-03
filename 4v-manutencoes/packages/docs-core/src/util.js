import { DOCT } from './doct.js';
import { BUSINESS } from '@4v/brand/site.config';

export const LANGS = ['pt', 'en', 'fr'];
export const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const fill = (s, m) => String(s).replace(/\{(\w+)\}/g, (_, k) => (m[k] !== undefined ? m[k] : ''));
export const todayISO = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
export function fmtDate(iso, lang) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return '';
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  try { return new Intl.DateTimeFormat(DOCT[lang].loc, { day: 'numeric', month: 'long', year: 'numeric' }).format(d); } catch (e) { return iso; }
}
export const sanitizeName = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

/** Company data defaults ("Meus dados"). Valdir can edit these in the app; the edits stay on his phone. */
export const CO_DEF = {
  razao: BUSINESS.legalNameME,
  nome: BUSINESS.person,
  cnpj: BUSINESS.cnpj,
  ie: BUSINESS.ie,
  end: BUSINESS.address.street,
  cidade: `${BUSINESS.address.city} – ${BUSINESS.address.region}`,
  cep: BUSINESS.address.postalCode,
  end2: '',
  whats: BUSINESS.phoneDisplay,
  email: BUSINESS.email,
  cidpad: BUSINESS.address.city,
  foro: `${BUSINESS.address.city} – ${BUSINESS.address.region}`,
  showaddr: false,
};

/** Voltage labels printed on documents. */
export const VOLT_BI = { pt: 'Bivolt', en: 'Dual voltage', fr: 'Bi-tension' };
export const voltLabel = (v, lang) => (v === '127' ? '127 V' : v === '220' ? '220 V' : v === 'bi' ? VOLT_BI[lang] : '');
