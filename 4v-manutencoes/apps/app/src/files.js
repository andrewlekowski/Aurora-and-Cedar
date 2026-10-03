/* Getting files off the phone: Web Share (WhatsApp etc.) and plain downloads. */

/** True when the browser can share a file of this type (Android Chrome, iPhone Safari). */
export function canShareFiles(type = 'application/pdf') {
  try {
    if (!navigator.canShare || !navigator.share) return false;
    return navigator.canShare({ files: [new File([new Uint8Array(1)], 'x.pdf', { type })] });
  } catch (e) { return false; }
}

/** @returns {Promise<'shared'|'cancelled'|'needs-gesture'|'unsupported'>} */
export async function shareFile(file, title) {
  if (!navigator.canShare || !navigator.canShare({ files: [file] })) return 'unsupported';
  try { await navigator.share({ files: [file], title }); return 'shared'; }
  catch (e) {
    if (e && e.name === 'AbortError') return 'cancelled';
    // Safari/Chrome drop the tap ("user activation") if making the PDF took too long.
    if (e && e.name === 'NotAllowedError') return 'needs-gesture';
    throw e;
  }
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.rel = 'noopener'; a.style.display = 'none';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export async function copyText(text, node) {
  // returns 'copied' | 'selected'
  try { await navigator.clipboard.writeText(text); return 'copied'; } catch (e) {}
  try {
    const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;left:0;top:0;opacity:0;font-size:16px';
    document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, text.length);
    const ok = document.execCommand && document.execCommand('copy'); ta.remove();
    if (ok) return 'copied';
  } catch (e) {}
  try {
    if (node) {
      if (node.select) { node.focus(); node.select(); }
      else { const r = document.createRange(); r.selectNodeContents(node); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    }
  } catch (e) {}
  return 'selected';
}
