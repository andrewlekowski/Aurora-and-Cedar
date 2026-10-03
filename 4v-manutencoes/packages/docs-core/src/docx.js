/* Block model → DOCX. `D` is the docx library module (docx@8.5.0), passed in so it can be lazy-loaded. */
import { headLines } from './blocks.js';

/**
 * @param {any} D docx module
 * @param {Array} blocks
 * @param {'pt'|'en'|'fr'} lang
 * @param {object} CO company data
 * @param {Uint8Array} logoBytes PNG bytes of the logo
 */
export function buildDocx(D, blocks, lang, CO, logoBytes) {
  const W = 9638;
  const NONE = { style: D.BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const noB = { top: NONE, bottom: NONE, left: NONE, right: NONE };
  const FONT = 'Arial';
  const runs = (text, o) => {
    o = o || {}; const out = [];
    String(text).split('\n').forEach((line, li) => {
      line.split(/(\*\*.+?\*\*)/).filter(s => s !== '').forEach((seg, i) => {
        const bd = /^\*\*.+\*\*$/.test(seg);
        out.push(new D.TextRun({ text: bd ? seg.slice(2, -2) : seg, bold: bd || !!o.bold, size: o.size || 22, font: FONT, break: (li > 0 && i === 0) ? 1 : undefined }));
      });
    });
    return out;
  };
  const para = (text, o) => { o = o || {}; return new D.Paragraph({ children: runs(text, o), spacing: { before: o.before || 0, after: o.after === undefined ? 100 : o.after }, alignment: o.align, indent: o.indent, border: o.border, keepNext: o.keepNext }); };
  const cell = (children, w, o) => { o = o || {}; return new D.TableCell({ children, width: { size: w, type: D.WidthType.DXA }, borders: o.borders || noB, margins: { top: o.mt === undefined ? 50 : o.mt, bottom: o.mb === undefined ? 50 : o.mb, left: o.ml === undefined ? 80 : o.ml, right: o.mr === undefined ? 80 : o.mr }, shading: o.shade ? { type: D.ShadingType.CLEAR, fill: o.shade, color: 'auto' } : undefined, verticalAlign: o.va }); };
  const tbl = (rows, widths, o) => new D.Table({ rows, width: { size: widths.reduce((a, c) => a + c, 0), type: D.WidthType.DXA }, columnWidths: widths, borders: (o && o.borders) || { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE } });
  const thin = { style: D.BorderStyle.SINGLE, size: 4, color: '888888' };
  const thick = { style: D.BorderStyle.SINGLE, size: 16, color: '000000' };
  const kids = [];
  blocks.forEach(x => {
    switch (x.t) {
      case 'head': {
        const L = headLines(lang, CO);
        const txt = [para('4V Manutencoes', { bold: true, size: 36, after: 0 }), para(L.sub, { size: 20, after: 0 }), para(L.contact, { size: 18, after: 0 })];
        if (L.addr) txt.push(para(L.addr, { size: 18, after: 0 }));
        const logoCell = logoBytes
          ? [new D.Paragraph({ children: [new D.ImageRun({ data: logoBytes, transformation: { width: 56, height: 56 }, type: 'png' })] })]
          : [para('', { after: 0 })];
        kids.push(tbl([new D.TableRow({ children: [cell(logoCell, 1100, { ml: 0 }), cell(txt, W - 1100, { va: D.VerticalAlign.CENTER })] })], [1100, W - 1100]));
        kids.push(new D.Paragraph({ children: [], spacing: { after: 200 }, border: { bottom: { style: D.BorderStyle.SINGLE, size: 16, color: '000000', space: 1 } } }));
        break;
      }
      case 'title':
        kids.push(tbl([new D.TableRow({ children: [cell([para(x.text, { bold: true, size: 28, after: 0 })], W - 2300, { ml: 0 }), cell([para(x.num, { bold: true, after: 0, align: D.AlignmentType.RIGHT })], 2300, { mr: 0, va: D.VerticalAlign.BOTTOM })] })], [W - 2300, 2300]));
        kids.push(para('', { after: 80 })); break;
      case 'rec':
        kids.push(tbl([new D.TableRow({ children: [cell([para(x.text, { bold: true, size: 36, after: 0 })], W - 3300, { ml: 0, va: D.VerticalAlign.CENTER }),
          cell([para(x.amount, { bold: true, size: 36, after: 0, align: D.AlignmentType.CENTER })], 3300, { borders: { top: thick, bottom: thick, left: thick, right: thick }, mt: 140, mb: 140 })] })], [W - 3300, 3300]));
        kids.push(para('', { after: 160 })); break;
      case 'h': kids.push(para(x.text.toUpperCase(), { bold: true, size: 22, before: 240, after: 100, keepNext: true, border: { bottom: { style: D.BorderStyle.SINGLE, size: 6, color: '000000', space: 2 } } })); break;
      case 'ch': kids.push(para(x.text, { bold: true, size: 22, before: 200, after: 40, keepNext: true })); break;
      case 'p': kids.push(para(x.text, { align: D.AlignmentType.LEFT })); break;
      case 'place': kids.push(para(x.text, { align: D.AlignmentType.RIGHT, before: 300, after: 100 })); break;
      case 'kv': {
        const rows = x.rows.map(r => new D.TableRow({ cantSplit: true, children: [cell([para(r[0], { bold: true, after: 0 })], 2900, { ml: 0 }), cell([para(r[1], { after: 0 })], W - 2900, { borders: { top: NONE, left: NONE, right: NONE, bottom: thin } })] }));
        kids.push(tbl(rows, [2900, W - 2900])); kids.push(para('', { after: 60 })); break;
      }
      case 'table': {
        const ws = x.widths.map(p => Math.round(W * p / 100)); ws[ws.length - 1] = W - ws.slice(0, -1).reduce((a, c) => a + c, 0);
        const bd = { top: thin, bottom: thin, left: thin, right: thin };
        const rows = [new D.TableRow({ tableHeader: true, children: x.head.map((c, i) => cell([para(c, { bold: true, after: 0 })], ws[i], { borders: bd, shade: 'E6E6E6' })) })]
          .concat(x.rows.map(r => new D.TableRow({ cantSplit: true, height: { value: 420, rule: D.HeightRule.ATLEAST }, children: r.map((c, i) => cell([para(c, { after: 0 })], ws[i], { borders: bd })) })));
        kids.push(tbl(rows, ws)); kids.push(para('', { after: 60 })); break;
      }
      case 'ol': x.items.forEach((i, n) => kids.push(para((n + 1) + '.\t' + i, { after: 60, indent: { left: 420, hanging: 420 } }))); break;
      case 'ul': x.items.forEach(i => kids.push(para('•\t' + i, { after: 60, indent: { left: 420, hanging: 420 } }))); break;
      case 'sign': {
        const n = x.single ? 2 : x.cols.length; const gap = 300; const cw = Math.floor(W / n);
        const cols = x.cols.slice(); if (x.single) cols.push({ lines: [] });
        const wOf = i => (i === cols.length - 1 ? W - cw * (n - 1) : cw);
        const cells = cols.map((c, i) => cell(c.lines.length ? [para('', { after: 0, before: 700 })].concat(c.lines.map((l, li) => para(l.x, { bold: !!l.b, size: 20, after: 0, border: li === 0 ? { top: { style: D.BorderStyle.SINGLE, size: 8, color: '000000', space: 4 } } : undefined }))) : [para('', { after: 0 })], wOf(i), { ml: i === 0 ? 0 : gap / 2, mr: i === cols.length - 1 ? 0 : gap / 2 }));
        kids.push(tbl([new D.TableRow({ cantSplit: true, children: cells })], cols.map((c, i) => wOf(i))));
        kids.push(para('', { after: 60 })); break;
      }
    }
  });
  return new D.Document({
    creator: '4V Manutencoes', title: '4V Manutencoes',
    styles: { default: { document: { run: { font: FONT, size: 22 } } } },
    sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } }, children: kids }],
  });
}
