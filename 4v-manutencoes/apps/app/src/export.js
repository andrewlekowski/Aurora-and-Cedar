/* PDF and DOCX generation. html2pdf.js and docx are lazy-loaded on the first tap. */
import { blocksHTML, buildDocx } from '@4v/docs-core';
import logoUrl from '@4v/brand/assets/logo_k.png';

export const LOGO_URL = logoUrl;

export async function makePdf(blocks, lang, CO) {
  const { default: html2pdf } = await import('html2pdf.js');
  try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) {}
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;background:#fff';
  host.innerHTML = blocksHTML(blocks, lang, CO, logoUrl).replace('class="paper"', 'class="paper pdf"');
  document.body.appendChild(host);
  try {
    const img = host.querySelector('img');
    if (img && !img.complete) await new Promise(r => { img.onload = img.onerror = r; });
    return await html2pdf().set({
      margin: [10, 0, 12, 0],
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: 794, scrollX: 0, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', 'li', 'p', '.d-sign', '.d-h', '.d-ch', '.d-head'] },
    }).from(host.firstElementChild).outputPdf('blob');
  } finally { host.remove(); }
}

let logoBytes = null;
export async function makeDocx(blocks, lang, CO) {
  const D = await import('docx');
  if (!logoBytes) {
    try { logoBytes = new Uint8Array(await (await fetch(logoUrl)).arrayBuffer()); } catch (e) { logoBytes = null; }
  }
  return D.Packer.toBlob(buildDocx(D, blocks, lang, CO, logoBytes));
}
