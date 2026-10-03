/* Block model → HTML (preview + PDF source) and plain text (WhatsApp). */
import { esc } from './util.js';
import { headLines } from './blocks.js';

const fmtB = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

/**
 * @param {Array} blocks from buildBlocks
 * @param {'pt'|'en'|'fr'} lang
 * @param {object} CO company data
 * @param {string} logoSrc URL of the black-ink logo
 */
export function blocksHTML(blocks, lang, CO, logoSrc) {
  let h = '';
  blocks.forEach(x => {
    switch (x.t) {
      case 'head': {
        const L = headLines(lang, CO);
        h += '<div class="d-head"><img src="' + esc(logoSrc) + '" alt="" width="56" height="56"><div><div class="d-brand">4V Manutencoes</div><div class="d-sub">' + esc(L.sub) + '</div><div class="d-contact">' + esc(L.contact) + '</div>' + (L.addr ? '<div class="d-addr">' + esc(L.addr) + '</div>' : '') + '</div></div>';
        break;
      }
      case 'title': h += '<div class="d-title"><h1>' + esc(x.text) + '</h1><span class="d-num">' + esc(x.num) + '</span></div>'; break;
      case 'rec': h += '<div class="d-rec"><h1>' + esc(x.text) + '</h1><div class="d-box">' + esc(x.amount) + '</div></div>'; break;
      case 'h': h += '<h2 class="d-h">' + esc(x.text) + '</h2>'; break;
      case 'ch': h += '<h3 class="d-ch">' + esc(x.text) + '</h3>'; break;
      case 'p': h += '<p class="d-p">' + fmtB(x.text) + '</p>'; break;
      case 'place': h += '<p class="d-place">' + esc(x.text) + '</p>'; break;
      case 'kv': h += '<table class="d-kv">' + x.rows.map(r => '<tr><th>' + esc(r[0]) + '</th><td style="white-space:pre-wrap">' + esc(r[1]) + '</td></tr>').join('') + '</table>'; break;
      case 'table': h += '<table class="d-tb"><thead><tr>' + x.head.map((c, i) => '<th style="width:' + x.widths[i] + '%">' + esc(c) + '</th>').join('') + '</tr></thead><tbody>' + x.rows.map(r => '<tr>' + r.map(c => '<td>' + esc(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table>'; break;
      case 'ol': h += '<ol class="d-ol">' + x.items.map(i => '<li>' + fmtB(i) + '</li>').join('') + '</ol>'; break;
      case 'ul': h += '<ul class="d-ul">' + x.items.map(i => '<li>' + fmtB(i) + '</li>').join('') + '</ul>'; break;
      case 'sign': h += '<div class="d-sign">' + x.cols.map(c => '<div class="sig">' + c.lines.map(l => (l.b ? '<b>' + esc(l.x) + '</b>' : '<div>' + esc(l.x) + '</div>')).join('') + '</div>').join('') + (x.single ? '<div class="sig" style="visibility:hidden;border:0"></div>' : '') + '</div>'; break;
    }
  });
  return '<div class="paper">' + h + '</div>';
}

export function blocksText(blocks, lang, CO) {
  const bold = s => String(s).replace(/\*\*(.+?)\*\*/g, '*$1*');
  const o = [];
  blocks.forEach(x => {
    switch (x.t) {
      case 'head': { const L = headLines(lang, CO); o.push('*4V Manutencoes*', L.sub, L.contact); if (L.addr) o.push(L.addr); o.push(''); break; }
      case 'title': o.push('*' + x.text + '*  ' + x.num, ''); break;
      case 'rec': o.push('*' + x.text + '*  ' + x.amount, ''); break;
      case 'h': case 'ch': o.push('', '*' + x.text + '*'); break;
      case 'p': o.push(bold(x.text), ''); break;
      case 'place': o.push('', x.text, ''); break;
      case 'kv': x.rows.forEach(r => o.push(r[0] + ': ' + r[1].replace(/\n/g, ' '))); break;
      case 'table': o.push(x.head.join(' | ')); x.rows.forEach(r => o.push(r.join(' | '))); o.push(''); break;
      case 'ol': x.items.forEach((i, n) => o.push((n + 1) + '. ' + bold(i))); o.push(''); break;
      case 'ul': x.items.forEach(i => o.push('- ' + bold(i))); o.push(''); break;
      case 'sign': x.cols.forEach(c => { o.push('', c.lines.map(l => l.x).join(' — ')); }); break;
    }
  });
  return o.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
