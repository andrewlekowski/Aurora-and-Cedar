/* 4V Documentos: views, editor and shell. Ported from prototype/src/views.js with real routes,
   native download / Web Share instead of the Claude-only download API, backup and PWA install. */
import '@4v/brand/fonts.css';
import '@4v/brand/tokens.css';
import '@4v/docs-core/paper.css';
import './style.css';
import { SITE_URL } from '@4v/brand/site.config';
import {
  esc, todayISO, extenso, parseMoney, PFX, presetOrient, buildBlocks, blocksHTML, blocksText, docFilename, CO_DEF,
} from '@4v/docs-core';
import photoUrl from '@4v/brand/assets/valdir_bw.jpg';
import { I18N } from './i18n.js';
import { store, exportBackup, parseBackup, restoreBackup } from './store.js';
import { app, reloadCompany, t, $, $$, reduceMotion } from './state.js';
import { canShareFiles, shareFile, downloadBlob, copyText } from './files.js';
import { makePdf, makeDocx, LOGO_URL } from './export.js';
import {
  CLI_ALL, CLI_KEYS, X, CLIENT_FLD, SCHEMA, TITLE_KEY, fieldHTML, sectionsHTML, applyVis, growAll, attachForm, showConfirm, backBtn,
} from './forms.js';

/* ================= document editor ================= */
let cur = null, prevTimer = null;
function baseDefaults(type) {
  const today = todayISO();
  const S = { date: today, city: app.CO.cidpad || '', cli_name: '', cli_ac: '', cli_doc: '', cli_addr: '', cli_city: '', cli_cep: '', cli_phone: '', cli_email: '', cli_type: 'pf', cli_rg: '', cli_nat: '', cli_rep: '', notes: '' };
  if (type === 'garantia' || type === 'entrega') Object.assign(S, { tipo: 'autoclave', equip: '', brand: '', model: '', serial: '', volt: '', prazo: '3', prazo_other: '' });
  if (type === 'garantia') Object.assign(S, { svc_date: today, svc_desc: '', parts: [{ qty: '', name: '' }], g_start: '' });
  if (type === 'entrega') Object.assign(S, { orient: presetOrient('autoclave'), incl_g: true });
  if (type === 'contrato') Object.assign(S, { items: [{ desc: '', serial: '' }], estado: 'usado', valor: '', pay: 'avista', pay_other: '', pay_det: '', deliv_date: today, deliv_how: 'retira', prazo: '3', prazo_other: '', foro: app.CO.foro || '', wit1: '', wit2: '' });
  if (type === 'recibo') Object.assign(S, { valor: '', ref: '', rpay: 'dinheiro' });
  return S;
}
function nextNum(type) {
  const p = PFX[type], y = new Date().getFullYear(), key = 'cnt_' + p + '_' + y;
  const n = (parseInt(store.get(key, 0), 10) || 0) + 1; store.set(key, n);
  return p + '-' + y + '-' + String(n).padStart(3, '0');
}
function loadState(type) {
  const saved = store.get('draft_' + type, null);
  const S = baseDefaults(type);
  if (saved && typeof saved === 'object' && saved.num) Object.assign(S, saved);
  else S.num = nextNum(type);
  store.set('draft_' + type, S);
  return S;
}
const saveDraft = () => store.set('draft_' + cur.type, cur.S);
function updateDerived() {
  const el = $('#f-extenso');
  if (el) { const v = parseMoney(cur.S.valor); el.textContent = isNaN(v) ? t('extenso_empty') : extenso(v, app.lang); el.style.color = isNaN(v) ? 'var(--muted)' : ''; }
}
function schedulePreview() { clearTimeout(prevTimer); prevTimer = setTimeout(renderPreview, 150); }
function renderPreview() {
  if (!cur) return;
  cur.blocks = buildBlocks(cur.type, cur.S, app.lang, app.CO);
  cur.file = null;
  const sizer = $('#paper-sizer'); if (!sizer) return;
  sizer.innerHTML = blocksHTML(cur.blocks, app.lang, app.CO, LOGO_URL);
  fitPaper();
}
function fitPaper() {
  const w = $('#paper-wrap'), sizer = $('#paper-sizer');
  if (!w || !sizer || !sizer.firstElementChild) return;
  const paper = sizer.firstElementChild;
  const avail = w.clientWidth || 320;
  const fit = Math.min(1, avail / 794);
  const s = cur && cur.zoom ? Math.min(1, fit * 2.2) : fit;
  paper.style.transform = 'scale(' + s + ')';
  sizer.style.width = Math.round(794 * s) + 'px';
  sizer.style.height = Math.ceil(paper.offsetHeight * s) + 'px';
}
function setStatus(msg, kind) {
  $$('.st-line').forEach(el => { el.textContent = msg || ''; el.className = 'status st-line' + (kind ? ' ' + kind : ''); });
}
let busy = false;
async function doExport(kind) {
  if (busy || !cur) return;
  busy = true; $$('[data-export]').forEach(b => { b.disabled = true; });
  const slot = $('#share-slot'); if (slot) slot.innerHTML = '';
  setStatus(t('st_prep'));
  try {
    clearTimeout(prevTimer); renderPreview();
    const ext = kind === 'docx' ? 'docx' : 'pdf';
    const name = docFilename(cur.type, cur.S, app.lang, ext);
    const blob = kind === 'docx' ? await makeDocx(cur.blocks, app.lang, app.CO) : await makePdf(cur.blocks, app.lang, app.CO);
    if (window.__testBlob) window.__testBlob(kind, blob, name);
    if (kind === 'share') {
      const file = new File([blob], name, { type: 'application/pdf' });
      const r = await shareFile(file, t(TITLE_KEY[cur.type]));
      if (r === 'shared') setStatus(t('st_shared'), 'ok');
      else if (r === 'cancelled') setStatus(t('st_cancel'));
      else if (r === 'needs-gesture') offerShare(file);
      else { downloadBlob(blob, name); setStatus(t('st_dl'), 'ok'); }
    } else {
      downloadBlob(blob, name);
      setStatus(t('st_dl'), 'ok');
    }
  } catch (e) {
    console.error('export failed', e);
    setStatus(t('st_err'), 'err');
  } finally { busy = false; $$('[data-export]').forEach(b => { b.disabled = false; }); }
}
/* The PDF is ready but the phone wants a fresh tap before opening the share sheet. */
function offerShare(file) {
  const slot = $('#share-slot');
  setStatus(t('share_ready'));
  if (!slot) return;
  slot.innerHTML = '<div class="share-ready"><p>' + esc(t('share_ready')) + '</p><button type="button" class="btn primary" id="btn-share-now">' + esc(t('share_tap')) + '</button></div>';
  $('#preview').scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
  $('#btn-share-now').onclick = async () => {
    try {
      const r = await shareFile(file, t(TITLE_KEY[cur.type]));
      if (r === 'shared') { slot.innerHTML = ''; setStatus(t('st_shared'), 'ok'); }
      else if (r === 'cancelled') setStatus(t('st_cancel'));
      else { downloadBlob(file, file.name); slot.innerHTML = ''; setStatus(t('st_dl'), 'ok'); }
    } catch (e) { console.error('share failed', e); setStatus(t('st_err'), 'err'); }
  };
}
async function doCopyDoc() {
  renderPreview();
  const txt = blocksText(cur.blocks, app.lang, app.CO);
  const box = $('#copybox');
  box.value = txt;
  const r = await copyText(txt, null);
  if (r === 'copied') { box.hidden = true; setStatus(t('st_copied'), 'ok'); }
  else { box.hidden = false; box.focus(); box.select(); setStatus(t('st_sel')); }
}
function viewDoc(root, type) {
  const sections = SCHEMA[type];
  const fieldsAll = [].concat(...sections.map(s => s.fields));
  cur = { type, S: loadState(type), zoom: false, blocks: [] };
  const S = cur.S;
  const share = canShareFiles();
  const main = share ? ['share', 'share_wa'] : ['pdf', 'dl_pdf'];
  root.innerHTML = backBtn() + '<h1 class="h1" style="margin-bottom:14px">' + esc(t(TITLE_KEY[type])) + '</h1>'
    + '<p class="tip">' + esc(t('tip')) + '</p>'
    + '<div id="newdoc-slot"></div><button type="button" class="btn small" id="newdoc-btn" style="margin-bottom:20px">' + esc(t('newdoc')) + '</button>'
    + '<div class="editor"><div class="form-col" id="form-col"></div>'
    + '<aside class="prev-col" id="preview" aria-label="' + esc(t('prev_t')) + '"><h2 class="h2">' + esc(t('prev_t')) + '</h2>'
    + '<div class="btns"><button type="button" class="btn primary" data-export="' + main[0] + '" id="btn-main">' + esc(t(main[1])) + '</button>'
    + (share ? '<button type="button" class="btn" data-export="pdf" id="btn-pdf">' + esc(t('dl_pdf')) + '</button>' : '')
    + '<button type="button" class="btn" data-export="docx" id="btn-docx">' + esc(t('dl_docx')) + '</button><button type="button" class="btn" id="btn-copy">' + esc(t('copy_txt')) + '</button></div>'
    + '<div id="share-slot"></div>'
    + '<div class="status st-line" role="status" aria-live="polite"></div><textarea id="copybox" class="copybox" rows="8" readonly hidden aria-label="' + esc(t('copy_txt')) + '" style="overflow:auto"></textarea>'
    + '<button type="button" class="btn small" id="btn-zoom">' + esc(t('zoom_in')) + '</button>'
    + '<div class="paper-wrap" id="paper-wrap"><div class="paper-sizer" id="paper-sizer"></div></div></aside></div>'
    + '<div class="bar"><div class="status st-line" aria-hidden="true"></div><button type="button" class="btn" id="bar-see">' + esc(t('see_doc')) + '</button><button type="button" class="btn primary" data-export="' + main[0] + '" id="bar-main">' + esc(t(share ? 'share_wa' : 'dl_pdf')) + '</button></div>';
  const fc = $('#form-col');
  const draw = () => {
    fc.innerHTML = sectionsHTML(sections, S);
    applyVis(fc, fieldsAll, S); growAll(fc); updateDerived();
  };
  draw(); renderPreview();
  const afterChange = () => { applyVis(fc, fieldsAll, S); updateDerived(); saveDraft(); schedulePreview(); };
  let pendingTipo = null;
  attachForm(fc, S, {
    before(k, v, el) {
      if (type === 'entrega' && k === 'tipo') {
        const edited = S.orient.some(o => o.text !== null || !o.key);
        if (edited) {
          pendingTipo = v; el.value = S.tipo;
          showConfirm($('#tipo-confirm', fc), t('confirm_tipo'), () => {
            const old = S.tipo; S.tipo = pendingTipo; S.orient = presetOrient(S.tipo); equipPrefill(old); draw(); afterChange();
          });
          return false;
        }
      }
      return true;
    },
    changed(k, el, old) {
      if (k === 'tipo') {
        equipPrefill(old);
        if (type === 'entrega') { S.orient = presetOrient(S.tipo); draw(); }
        else { const e = $('#f-equip', fc); if (e) e.value = S.equip; }
      }
      if (k === 'cli_type' || k === 'prazo' || k === 'pay' || k === 'incl_g') applyVis(fc, fieldsAll, S);
      afterChange();
    },
    act(a, b) {
      if (a === 'add-row') { const f = fieldsAll.find(x => x.k === b.dataset.r); S[f.k].push(Object.assign({}, f.blank)); draw(); saveDraft(); schedulePreview(); const n = S[f.k].length - 1; const first = $('#f-' + f.k + '-' + n + '-' + f.cols[0].c, fc); if (first) first.focus(); }
      else if (a === 'rm-row') { const f = fieldsAll.find(x => x.k === b.dataset.r); S[f.k].splice(+b.dataset.i, 1); if (!S[f.k].length) S[f.k].push(Object.assign({}, f.blank)); draw(); saveDraft(); schedulePreview(); }
      else if (a === 'add-orient') { S.orient.push({ key: null, text: '', on: true }); draw(); saveDraft(); schedulePreview(); const el = $('#f-orient-' + (S.orient.length - 1), fc); if (el) el.focus(); }
      else if (a === 'rm-orient') { S.orient.splice(+b.dataset.i, 1); draw(); saveDraft(); schedulePreview(); }
      else if (a === 'save-client') saveClientFromDoc();
    },
  });
  function equipPrefill(old) {
    const lbl = (l, tp) => I18N[l]['tipo_' + tp];
    const wasLabel = ['pt', 'en', 'fr'].some(l => S.equip === lbl(l, old));
    if (!S.equip || wasLabel) S.equip = S.tipo === 'outro' ? '' : lbl(app.lang, S.tipo);
  }
  fc.addEventListener('change', e => {
    if (e.target.id !== 'cli-select' || !e.target.value) return;
    const c = store.get('clients', []).find(x => x.id === e.target.value); if (!c) return;
    CLI_KEYS[type].forEach(k => { if (c[k] !== undefined) S[k] = c[k]; });
    draw(); afterChange();
  });
  function saveClientFromDoc() {
    const st = $('#cli-status', fc);
    if (!String(S.cli_name || '').trim()) { st.textContent = t('cli_need_name'); st.className = 'status err'; return; }
    const list = store.get('clients', []);
    const nm = S.cli_name.trim().toLowerCase();
    let c = list.find(x => String(x.cli_name || '').trim().toLowerCase() === nm);
    if (!c) { c = { id: 'c' + Date.now().toString(36) }; CLI_ALL.forEach(k => { c[k] = k === 'cli_type' ? 'pf' : ''; }); list.push(c); }
    CLI_KEYS[type].forEach(k => { c[k] = S[k]; });
    store.set('clients', list);
    const sel = $('#cli-select', fc);
    if (sel) sel.innerHTML = '<option value="">' + esc(t('cli_saved_ph')) + '</option>' + list.map(x => '<option value="' + esc(x.id) + '">' + esc(x.cli_name || '—') + '</option>').join('');
    else draw();
    const st2 = $('#cli-status', fc); st2.textContent = t('cli_saved_ok'); st2.className = 'status ok';
  }
  $('#newdoc-btn').onclick = () => {
    showConfirm($('#newdoc-slot'), t('confirm_new'), () => {
      store.del('draft_' + type);
      const ns = baseDefaults(type); ns.num = nextNum(type);
      Object.keys(S).forEach(k => delete S[k]); Object.assign(S, ns);
      store.set('draft_' + type, S);
      draw(); renderPreview(); setStatus(''); window.scrollTo(0, 0);
    });
  };
  $$('[data-export]').forEach(b => { b.onclick = () => doExport(b.dataset.export); });
  $('#btn-copy').onclick = doCopyDoc;
  $('#bar-see').onclick = () => $('#preview').scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
  $('#btn-zoom').onclick = function () { cur.zoom = !cur.zoom; this.textContent = t(cur.zoom ? 'zoom_out' : 'zoom_in'); fitPaper(); };
}

/* ================= home ================= */
let installEvt = null;
const isStandalone = () => { try { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) { return false; } };
function installCard() {
  if (isStandalone() || store.get('install_done', false)) return '';
  return '<section class="install" id="install" aria-labelledby="install-t"><h2 id="install-t">' + esc(t('install_t')) + '</h2><p>' + esc(t('install_lead')) + '</p>'
    + (installEvt ? '<button type="button" class="btn primary" data-act="install">' + esc(t('install_btn')) + '</button>' : '<p>' + esc(t('install_android')) + '</p><p>' + esc(t('install_iphone')) + '</p>')
    + '<div class="row"><button type="button" class="btn small" data-act="install-close">' + esc(t('install_close')) + '</button></div></section>';
}
function viewInicio(root) {
  const h = new Date().getHours();
  const g = h >= 5 && h < 12 ? 'greet_m' : h >= 12 && h < 18 ? 'greet_a' : 'greet_n';
  const tile = (href, tk, dk) => '<a class="tile" href="/' + href + '"><span class="tt">' + esc(t(tk)) + '</span>' + (dk ? '<span class="td">' + esc(t(dk)) + '</span>' : '') + '</a>';
  root.innerHTML = '<div class="hero-home"><img src="' + photoUrl + '" alt="Valdir Bicudo" width="112" height="112"><h1 class="h1">' + esc(t(g)) + '</h1></div>'
    + installCard()
    + '<h2 class="h2">' + esc(t('home_q')) + '</h2><div class="tiles">'
    + tile('garantia', 'tile_g_t', 'tile_g_d') + tile('entrega', 'tile_e_t', 'tile_e_d') + tile('contrato', 'tile_c_t', 'tile_c_d') + tile('recibo', 'tile_r_t', 'tile_r_d') + '</div>'
    + '<h2 class="h2">' + esc(t('how_t')) + '</h2><ol class="steps"><li>' + esc(t('how1')) + '</li><li>' + esc(t('how2')) + '</li><li>' + esc(t('how3')) + '</li></ol>'
    + '<h2 class="h2">' + esc(t('other_t')) + '</h2><div class="tiles small">' + tile('clientes', 'o_clients') + tile('dados', 'o_data')
    + '<a class="tile out" href="' + esc(SITE_URL) + '" target="_blank" rel="noopener"><span class="tt">' + esc(t('o_site')) + '</span></a></div>'
    + '<p class="note">' + esc(t('saved_note')) + '</p>'
    + '<div id="logout-slot"></div><form method="post" action="/logout" id="logout-form"><button type="button" class="btn small" data-act="logout">' + esc(t('logout')) + '</button></form>';
  root.addEventListener('click', async e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    if (b.dataset.act === 'install-close') { store.set('install_done', true); const c = $('#install'); if (c) c.remove(); }
    else if (b.dataset.act === 'install' && installEvt) {
      installEvt.prompt();
      try { const r = await installEvt.userChoice; if (r && r.outcome === 'accepted') { store.set('install_done', true); const c = $('#install'); if (c) c.remove(); } } catch (err) {}
      installEvt = null;
    } else if (b.dataset.act === 'logout') {
      showConfirm($('#logout-slot'), t('logout_confirm'), () => $('#logout-form').submit());
    }
  });
}

/* ================= clients ================= */
function viewClientes(root) {
  let editing = null, confirmId = null;
  const fields = CLI_ALL.map(k => { const f = Object.assign({}, CLIENT_FLD[k]); if (k === 'cli_type') f.lk = 'f_cli_type_c'; return f; });
  const draw = () => {
    const list = store.get('clients', []);
    let h = backBtn() + '<h1 class="h1" style="margin-bottom:16px">' + esc(t('clients_t')) + '</h1>';
    if (editing) {
      h += '<section class="card"><h2><span>' + esc(t('client_form_t')) + '</span></h2><div id="cf">' + fields.map(f => fieldHTML(f, editing.data, 'cl-')).join('') + '</div><div class="row" style="margin-top:16px"><button type="button" class="btn primary" data-act="cl-save">' + esc(t('save')) + '</button><button type="button" class="btn" data-act="cl-cancel">' + esc(t('cancel')) + '</button></div><div class="status" id="cl-status" role="status"></div></section>';
    } else {
      h += '<button type="button" class="btn primary" data-act="cl-add" style="margin-bottom:18px">+ ' + esc(t('add_client')) + '</button>';
      if (!list.length) h += '<p class="lead">' + esc(t('clients_empty')) + '</p>';
      list.forEach(c => {
        h += '<div class="cl"><b>' + esc(c.cli_name || '—') + '</b><span class="muted">' + esc([c.cli_city, c.cli_phone].filter(Boolean).join(' · ')) + '</span>';
        if (confirmId === c.id) h += '<div class="confirm" role="alertdialog" style="margin-bottom:0"><p>' + esc(t('del_confirm')) + '</p><div class="row"><button type="button" class="btn primary" data-act="cl-del-yes" data-id="' + esc(c.id) + '">' + esc(t('yes')) + '</button><button type="button" class="btn" data-act="cl-del-no">' + esc(t('no')) + '</button></div></div>';
        else h += '<div class="row"><button type="button" class="btn small" data-act="cl-edit" data-id="' + esc(c.id) + '">' + esc(t('edit')) + '</button><button type="button" class="btn small" data-act="cl-del" data-id="' + esc(c.id) + '">' + esc(t('del')) + '</button></div>';
        h += '</div>';
      });
    }
    root.innerHTML = h;
    if (editing) {
      const cf = $('#cf'); applyVis(cf, fields, editing.data);
      attachForm(cf, editing.data, { changed() { applyVis(cf, fields, editing.data); } });
    }
  };
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const a = b.dataset.act, list = store.get('clients', []);
    if (a === 'cl-add') { const d = {}; CLI_ALL.forEach(k => { d[k] = k === 'cli_type' ? 'pf' : ''; }); editing = { id: null, data: d }; draw(); }
    else if (a === 'cl-edit') { const c = list.find(x => x.id === b.dataset.id); if (c) { editing = { id: c.id, data: Object.assign({}, c) }; draw(); } }
    else if (a === 'cl-cancel') { editing = null; draw(); }
    else if (a === 'cl-save') {
      if (!String(editing.data.cli_name || '').trim()) { const s = $('#cl-status'); s.textContent = t('cli_need_name'); s.className = 'status err'; return; }
      if (editing.id) { const i = list.findIndex(x => x.id === editing.id); if (i >= 0) list[i] = Object.assign({}, editing.data, { id: editing.id }); }
      else list.push(Object.assign({}, editing.data, { id: 'c' + Date.now().toString(36) }));
      store.set('clients', list); editing = null; draw();
    }
    else if (a === 'cl-del') { confirmId = b.dataset.id; draw(); }
    else if (a === 'cl-del-no') { confirmId = null; draw(); }
    else if (a === 'cl-del-yes') { store.set('clients', list.filter(x => x.id !== b.dataset.id)); confirmId = null; draw(); }
  });
  draw();
}

/* ================= company data + backup ================= */
const CO_FIELDS = ['razao', 'nome', 'cnpj', 'ie', 'end', 'cidade', 'cep', 'end2', 'whats', 'email', 'cidpad', 'foro', 'showaddr'];
function viewDados(root) {
  const S = {}; CO_FIELDS.forEach(k => { S['co_' + k] = app.CO[k]; });
  const fields = CO_FIELDS.map(k => X('co_' + k, { lk: 'co_' + k, type: k === 'showaddr' ? 'check' : k === 'whats' ? 'tel' : k === 'email' ? 'email' : 'text', im: k === 'cep' ? 'numeric' : undefined }));
  root.innerHTML = backBtn() + '<h1 class="h1" style="margin-bottom:12px">' + esc(t('data_t')) + '</h1><p class="lead">' + esc(t('data_lead')) + '</p>'
    + '<section class="card" style="margin-top:18px"><div id="df">' + fields.map(f => fieldHTML(f, S, 'd-')).join('') + '</div><button type="button" class="btn primary" id="df-save" style="margin-top:16px">' + esc(t('save')) + '</button><div class="status" id="df-status" role="status" aria-live="polite"></div></section>'
    + '<section class="card backup" aria-labelledby="bk-t"><h2 id="bk-t"><span>' + esc(t('backup_t')) + '</span></h2><p>' + esc(t('backup_lead')) + '</p>'
    + '<div class="row"><button type="button" class="btn primary" id="bk-save">' + esc(t('backup_btn')) + '</button>'
    + '<label class="btn" for="bk-file">' + esc(t('restore_btn')) + '</label></div><input type="file" id="bk-file" accept=".json,application/json" hidden>'
    + '<div id="bk-confirm"></div><div class="status" id="bk-status" role="status" aria-live="polite"></div></section>';
  attachForm($('#df'), S, { changed() { $('#df-status').textContent = ''; } });
  $('#df-save').onclick = () => {
    const o = {}; CO_FIELDS.forEach(k => { o[k] = S['co_' + k]; });
    o.showaddr = !!o.showaddr;
    app.CO = Object.assign({}, CO_DEF, o); store.set('company', o);
    const st = $('#df-status'); st.textContent = t('data_saved'); st.className = 'status ok';
  };
  const bst = (msg, kind) => { const s = $('#bk-status'); s.textContent = msg; s.className = 'status' + (kind ? ' ' + kind : ''); };
  $('#bk-save').onclick = async () => {
    const name = '4V-Documentos-copia-' + todayISO() + '.json';
    const blob = new Blob([JSON.stringify(exportBackup(), null, 1)], { type: 'application/json' });
    const file = new File([blob], name, { type: 'application/json' });
    try {
      const r = canShareFiles('application/json') ? await shareFile(file, t('backup_t')) : 'unsupported';
      if (r === 'cancelled') { bst(t('st_cancel')); return; }
      if (r !== 'shared') downloadBlob(blob, name);
      bst(t('backup_ok'), 'ok');
    } catch (e) { console.error('backup failed', e); downloadBlob(blob, name); bst(t('backup_ok'), 'ok'); }
  };
  $('#bk-file').onchange = async e => {
    const f = e.target.files && e.target.files[0]; e.target.value = '';
    if (!f) return;
    const o = parseBackup(await f.text());
    if (!o) { bst(t('restore_err'), 'err'); return; }
    showConfirm($('#bk-confirm'), t('restore_confirm'), () => {
      restoreBackup(o); reloadCompany();
      const l = store.get('lang', app.lang); if (I18N[l]) app.lang = l;
      show(true);
      const s = $('#bk-status'); if (s) { s.textContent = t('restore_ok'); s.className = 'status ok'; }
    });
  };
}

/* ================= shell ================= */
const VIEWS = ['garantia', 'entrega', 'contrato', 'recibo', 'clientes', 'dados'];
function route() { const p = location.pathname.replace(/^\/+|\/+$/g, ''); return VIEWS.includes(p) ? p : 'inicio'; }
function show(keepScroll) {
  const view = route();
  const old = $('#app');
  const root = old.cloneNode(false); old.parentNode.replaceChild(root, old);
  cur = null;
  document.body.classList.toggle('has-bar', !!PFX[view]);
  $('main').className = PFX[view] ? 'wide' : '';
  if (PFX[view]) viewDoc(root, view);
  else if (view === 'clientes') viewClientes(root);
  else if (view === 'dados') viewDados(root);
  else viewInicio(root);
  $$('.lang button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === app.lang ? 'true' : 'false'));
  document.documentElement.lang = app.lang === 'pt' ? 'pt-BR' : app.lang;
  document.title = (PFX[view] ? t(TITLE_KEY[view]) + ' · ' : view === 'clientes' ? t('clients_t') + ' · ' : view === 'dados' ? t('data_t') + ' · ' : '') + '4V Documentos';
  if (!keepScroll) window.scrollTo(0, 0);
}
function navigate(path) {
  if (path === location.pathname) return;
  history.pushState(null, '', path);
  show(false);
}
function setLang(l) {
  if (!I18N[l] || l === app.lang) return;
  app.lang = l; store.set('lang', l); show(true);
}
function boot() {
  $$('.lang button').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
  window.addEventListener('popstate', () => show(false));
  window.addEventListener('resize', () => { if (cur) fitPaper(); });
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); installEvt = e;
    if (route() === 'inicio' && $('#install')) show(true);
  });
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || a.target || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin) return;
    const p = u.pathname.replace(/^\/+|\/+$/g, '');
    if (p !== '' && !VIEWS.includes(p)) return;
    e.preventDefault(); navigate(u.pathname);
  });
  show(false);
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
  }
}
boot();
