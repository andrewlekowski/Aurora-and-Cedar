/*
 * Document builders → block model. One block list feeds the HTML preview, the PDF,
 * the DOCX and the plain text for WhatsApp. Ported from prototype/src/docs.js.
 * Empty field ⇒ a "______" line so Valdir can fill it in by hand.
 */
import { DOCT } from './doct.js';
import { extenso, parseMoney, fmtBRL } from './money.js';
import { fill, fmtDate, sanitizeName, voltLabel } from './util.js';

export const PFX = { garantia: 'G', entrega: 'E', contrato: 'C', recibo: 'R' };
export const DOC_TYPES = Object.keys(PFX);
export const EQUIP_TYPES = ['autoclave', 'odonto', 'estufa', 'exaustao', 'bio', 'outro'];

export function presetText(key, lang, CO) {
  const T = DOCT[lang];
  if (key === 'selo') return T.o_selo;
  if (key === 'contato') return fill(T.o_contato, { tel: CO.whats });
  const p = String(key).split('.');
  const a = T.presets[p[0]];
  return (a && a[+p[1]]) || '';
}
export const orientText = (it, lang, CO) => (it.text !== null && it.text !== undefined ? it.text : presetText(it.key, lang, CO));
export function presetOrient(tipo) {
  const k = DOCT.pt.presets[tipo] ? tipo : 'outro';
  const items = DOCT.pt.presets[k].map((_, i) => ({ key: k + '.' + i, text: null, on: true }));
  items.push({ key: 'selo', text: null, on: true }, { key: 'contato', text: null, on: true });
  return items;
}

/**
 * @param {'garantia'|'entrega'|'contrato'|'recibo'} type
 * @param {object} S form state
 * @param {'pt'|'en'|'fr'} lang
 * @param {object} CO company data (see CO_DEF)
 */
export function buildBlocks(type, S, lang, CO) {
  const T = DOCT[lang];
  const u = v => String(v == null ? '' : v).replace(/\*\*/g, '*').trim();
  const bl = (v, n) => u(v) || '_'.repeat(n || 14);
  const dt = iso => fmtDate(iso, lang);
  const term = () => (S.prazo === 'other' ? bl(S.prazo_other, 12) : T.months[S.prazo] || T.months[3]);
  const place = { t: 'place', text: fill(T.place, { city: bl(S.city, 12), date: dt(S.date) || '_'.repeat(16) }) };
  const numTxt = T.num + ' ' + u(S.num);
  const cliRows = () => {
    const r = [[T.k_name, bl(S.cli_name, 30)]];
    if (u(S.cli_ac)) r.push([T.k_ac, u(S.cli_ac)]);
    r.push([T.k_doc, bl(S.cli_doc, 22)]);
    r.push([T.k_addr, bl(S.cli_addr, 36)]);
    const city = [u(S.cli_city), u(S.cli_cep) ? 'CEP ' + u(S.cli_cep) : ''].filter(Boolean).join(' — ');
    r.push([T.k_city, city || '_'.repeat(22)]);
    if (u(S.cli_phone)) r.push([T.k_phone, u(S.cli_phone)]);
    if (u(S.cli_email)) r.push([T.k_email, u(S.cli_email)]);
    return r;
  };
  const eqRows = () => [[T.k_equip, bl(S.equip, 30)], [T.k_brand, bl(S.brand, 22)], [T.k_model, bl(S.model, 22)], [T.k_serial, bl(S.serial, 22)], [T.k_volt, voltLabel(S.volt, lang) || '_'.repeat(14)]];
  const tel = u(CO.whats), mail = u(CO.email);
  let b = [];
  if (type === 'garantia') {
    const parts = (S.parts || []).filter(p => u(p.qty) || u(p.name)).map(p => [u(p.qty), u(p.name)]);
    if (!parts.length) for (let i = 0; i < 3; i++) parts.push(['', '']);
    const start = dt(S.g_start || S.date) || '_'.repeat(16);
    b = [{ t: 'title', text: T.G_title, num: numTxt },
      { t: 'h', text: T.sec_client }, { t: 'kv', rows: cliRows() },
      { t: 'h', text: T.sec_equip }, { t: 'kv', rows: eqRows() },
      { t: 'h', text: T.sec_service },
      { t: 'kv', rows: [[T.k_svcdate, dt(S.svc_date) || '_'.repeat(16)], [T.k_desc, u(S.svc_desc) || ('_'.repeat(44) + '\n' + '_'.repeat(44))]] },
      { t: 'table', head: [T.th_qty, T.th_part], rows: parts, widths: [14, 86] },
      { t: 'h', text: T.sec_warranty },
      { t: 'p', text: '1. ' + fill(T.g1, { term: term(), start }) },
      { t: 'p', text: '2. ' + T.g2 },
      { t: 'p', text: '3. ' + T.g3 },
      { t: 'p', text: '4. ' + fill(T.g4, { tel, email: mail }) },
      { t: 'p', text: '**' + T.nocover + '**' },
      { t: 'ul', items: T.nc }];
    if (u(S.notes)) b.push({ t: 'h', text: T.obs }, { t: 'p', text: u(S.notes) });
    b.push(place, { t: 'sign', cols: [{ lines: [{ x: u(CO.nome), b: 1 }, { x: T.sig_tech }] }, { lines: [{ x: T.sig_client }, { x: T.sig_date }] }] });
  } else if (type === 'entrega') {
    const items = (S.orient || []).filter(o => o.on).map(o => u(orientText(o, lang, CO))).filter(Boolean);
    const cr = [[T.sec_client, bl(S.cli_name, 30)]];
    if (u(S.cli_ac)) cr.push([T.k_ac, u(S.cli_ac)]);
    b = [{ t: 'title', text: T.E_title, num: numTxt },
      { t: 'kv', rows: cr },
      { t: 'p', text: T.E_intro },
      { t: 'kv', rows: eqRows() }];
    b.push({ t: 'h', text: T.E_orient });
    b.push({ t: 'ol', items: items.length ? items : ['_'.repeat(50), '_'.repeat(50)] });
    if (S.incl_g !== false) b.push({ t: 'p', text: fill(T.E_warr, { term: term(), start: dt(S.date) || '_'.repeat(16) }) });
    if (u(S.notes)) b.push({ t: 'h', text: T.obs }, { t: 'p', text: u(S.notes) });
    b.push({ t: 'p', text: T.E_decl }, place, { t: 'sign', cols: [{ lines: [{ x: fill(T.E_by, { name: u(CO.nome) }), b: 1 }] }, { lines: [{ x: T.E_recv }, { x: T.sig_date }] }] });
  } else if (type === 'contrato') {
    const pj = S.cli_type === 'pj';
    const v = parseMoney(S.valor);
    const items = (S.items || []).filter(i => u(i.desc) || u(i.serial)).map(i => [u(i.desc), u(i.serial)]);
    if (!items.length) items.push(['', '']);
    const pay = S.pay === 'other' ? bl(S.pay_other, 20) : T.pays[S.pay] || T.pays.avista;
    const det = u(S.pay_det).replace(/[.\s]+$/, '');
    const buyer = pj
      ? fill(T.C_pj, { name: bl(S.cli_name, 28), doc: bl(S.cli_doc, 18), addr: bl(S.cli_addr, 30), city: bl(S.cli_city, 16), cep: bl(S.cli_cep, 10), rep: bl(S.cli_rep, 28) })
      : fill(T.C_pf, { name: bl(S.cli_name, 28), nat: bl(S.cli_nat, 14), rg: bl(S.cli_rg, 14), doc: bl(S.cli_doc, 16), addr: bl(S.cli_addr, 30), city: bl(S.cli_city, 16), cep: bl(S.cli_cep, 10) });
    const witness = (n, val) => ({ lines: u(val) ? [{ x: fill(T.C_wit, { n }), b: 1 }, { x: u(val) }] : [{ x: fill(T.C_wit, { n }), b: 1 }, { x: fill(T.C_name, { v: '_'.repeat(20) }) }, { x: fill(T.C_cpf, { v: '_'.repeat(16) }) }] });
    b = [{ t: 'title', text: T.C_title, num: numTxt },
      { t: 'p', text: fill(T.C_seller, { razao: u(CO.razao), cnpj: u(CO.cnpj), ie: u(CO.ie), addr: u(CO.end), city: u(CO.cidade), cep: u(CO.cep), resp: u(CO.nome) }) },
      { t: 'p', text: buyer },
      { t: 'p', text: T.C_agree },
      { t: 'ch', text: T.C_h[0] }, { t: 'p', text: fill(T.C_1, { state: T.states[S.estado] || T.states.usado }) },
      { t: 'table', head: T.C_th, rows: items, widths: [68, 32] },
      { t: 'ch', text: T.C_h[1] }, { t: 'p', text: fill(T.C_2, { value: isNaN(v) ? '_'.repeat(14) : fmtBRL(v), words: isNaN(v) ? '_'.repeat(26) : extenso(v, lang), pay, det: det ? '; ' + det : '' }) },
      { t: 'ch', text: T.C_h[2] }, { t: 'p', text: fill(T.C_3, { date: dt(S.deliv_date) || '_'.repeat(16) }) },
      { t: 'ch', text: T.C_h[3] }, { t: 'p', text: T.C_4[S.deliv_how] || T.C_4.retira },
      { t: 'ch', text: T.C_h[4] }, { t: 'p', text: T.C_5 },
      { t: 'ch', text: T.C_h[5] }].concat(T.C_6.map(x => ({ t: 'p', text: fill(x, { term: term(), tel, email: mail }) })), [
      { t: 'ch', text: T.C_h[6] }, { t: 'p', text: T.C_7 },
      { t: 'ch', text: T.C_h[7] }, { t: 'p', text: T.C_8 },
      { t: 'ch', text: T.C_h[8] }, { t: 'p', text: fill(T.C_9, { foro: bl(S.foro, 18) }) },
      { t: 'p', text: T.C_close }, place,
      { t: 'sign', cols: [{ lines: [{ x: T.C_sellerRole, b: 1 }, { x: u(CO.razao) }, { x: fill(T.C_cnpj, { v: u(CO.cnpj) }) }] }, { lines: [{ x: T.C_buyerRole, b: 1 }, { x: bl(S.cli_name, 24) }, { x: fill(pj ? T.C_cnpj : T.C_cpfdoc, { v: bl(S.cli_doc, 18) }) }] }] },
      { t: 'sign', cols: [witness(1, S.wit1), witness(2, S.wit2)] }]);
  } else if (type === 'recibo') {
    const v = parseMoney(S.valor);
    b = [{ t: 'rec', text: T.R_title + ' ' + numTxt, amount: 'R$ ' + (isNaN(v) ? '__________' : fmtBRL(v)) },
      { t: 'p', text: fill(T.R_1, { name: bl(S.cli_name, 30), doc: bl(S.cli_doc, 20), value: isNaN(v) ? '_'.repeat(12) : fmtBRL(v), words: isNaN(v) ? '_'.repeat(26) : extenso(v, lang), ref: u(S.ref) || '_'.repeat(40) }) },
      { t: 'p', text: fill(T.R_2, { pay: T.rpays[S.rpay] || T.rpays.dinheiro }) },
      { t: 'p', text: T.R_3 }, place,
      { t: 'sign', cols: [{ lines: [{ x: u(CO.nome), b: 1 }, { x: u(CO.razao) + ' — CNPJ ' + u(CO.cnpj) }] }], single: 1 }];
  }
  return [{ t: 'head' }].concat(b);
}

export function docFilename(type, S, lang, ext) {
  const nm = sanitizeName(S.cli_name);
  return DOCT[lang].fn[PFX[type]] + '-' + sanitizeName(S.num) + (nm ? '-' + nm : '') + '.' + ext;
}

export function headLines(lang, CO) {
  const T = DOCT[lang];
  const contact = T.wapp + ' ' + CO.whats + ' · ' + CO.email + ' · CNPJ ' + CO.cnpj;
  const addr = CO.showaddr ? [CO.end, CO.cidade, CO.cep ? 'CEP ' + CO.cep : ''].filter(Boolean).join(', ') + (CO.end2 ? ' | ' + CO.end2 : '') : '';
  return { sub: T.sub, contact, addr };
}
