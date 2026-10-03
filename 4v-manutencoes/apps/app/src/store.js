/* localStorage wrapper ("v4:" prefix). Every access is guarded; the app still works without storage. */
export const PREFIX = 'v4:';
const mem = {};
export const store = {
  get(k, d) {
    try { const v = localStorage.getItem(PREFIX + k); if (v !== null) return JSON.parse(v); } catch (e) {}
    return (k in mem) ? JSON.parse(JSON.stringify(mem[k])) : d;
  },
  set(k, v) { mem[k] = v; try { localStorage.setItem(PREFIX + k, JSON.stringify(v)); } catch (e) {} },
  del(k) { delete mem[k]; try { localStorage.removeItem(PREFIX + k); } catch (e) {} },
};

/** Backup = every v4:* key. Restore replaces them. */
export const BACKUP_KIND = '4v-documentos-backup';
export function exportBackup() {
  const data = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) data[k.slice(PREFIX.length)] = JSON.parse(localStorage.getItem(k));
    }
  } catch (e) {}
  for (const k of Object.keys(mem)) if (!(k in data)) data[k] = mem[k];
  return { kind: BACKUP_KIND, version: 1, created: new Date().toISOString(), data };
}
export function parseBackup(text) {
  let o;
  try { o = JSON.parse(text); } catch (e) { return null; }
  if (!o || o.kind !== BACKUP_KIND || !o.data || typeof o.data !== 'object' || Array.isArray(o.data)) return null;
  return o;
}
export function restoreBackup(o) {
  try {
    const old = [];
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(PREFIX)) old.push(k); }
    old.forEach(k => localStorage.removeItem(k));
  } catch (e) {}
  for (const k of Object.keys(mem)) delete mem[k];
  for (const [k, v] of Object.entries(o.data)) store.set(k, v);
}
