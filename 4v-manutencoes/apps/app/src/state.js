/* Shared app state: language, company data ("Meus dados") and the t() translator. */
import { CO_DEF } from '@4v/docs-core';
import { I18N } from './i18n.js';
import { store } from './store.js';

export const app = {
  lang: I18N[store.get('lang', 'pt')] ? store.get('lang', 'pt') : 'pt',
  CO: Object.assign({}, CO_DEF, store.get('company', {})),
};
export const reloadCompany = () => { app.CO = Object.assign({}, CO_DEF, store.get('company', {})); };
export const t = k => { const v = I18N[app.lang][k]; return v === undefined ? (I18N.pt[k] !== undefined ? I18N.pt[k] : k) : v; };
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
export const reduceMotion = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
