/* The login page: one big password field, one big button. PT (default) / EN / FR. Inline CSS, no JS. */
type Lang = 'pt' | 'en' | 'fr';
const L: Record<Lang, Record<string, string>> = {
  pt: { title: 'Entrar', lead: 'Digite a senha para abrir os documentos.', pw: 'Senha', btn: 'Entrar', show: 'Mostrar a senha', wrong: 'Senha errada. Tente de novo.', locked: 'Muitas tentativas. Espere {m} minutos e tente de novo.', config: 'O acesso ainda não foi configurado. Fale com o Andrew.' },
  en: { title: 'Sign in', lead: 'Type the password to open the documents.', pw: 'Password', btn: 'Sign in', show: 'Show password', wrong: 'Wrong password. Please try again.', locked: 'Too many attempts. Wait {m} minutes and try again.', config: 'Access is not set up yet. Please contact Andrew.' },
  fr: { title: 'Connexion', lead: 'Tapez le mot de passe pour ouvrir les documents.', pw: 'Mot de passe', btn: 'Entrer', show: 'Afficher le mot de passe', wrong: 'Mot de passe incorrect. Réessayez.', locked: 'Trop de tentatives. Attendez {m} minutes et réessayez.', config: 'L’accès n’est pas encore configuré. Contactez Andrew.' },
};

export function pickLang(url: URL, acceptLanguage: string | null): Lang {
  const q = url.searchParams.get('lang');
  if (q === 'pt' || q === 'en' || q === 'fr') return q;
  const al = (acceptLanguage || '').toLowerCase();
  const first = al.split(',')[0] || '';
  if (first.startsWith('en')) return 'en';
  if (first.startsWith('fr')) return 'fr';
  return 'pt';
}

export type LoginMsg = '' | 'wrong' | 'locked' | 'config';

export function loginPage(lang: Lang, msg: LoginMsg = '', lockedMinutes = 5): string {
  const t = L[lang];
  const err = msg ? `<p class="err" role="alert">${t[msg].replace('{m}', String(lockedMinutes))}</p>` : '';
  const langs = (['pt', 'en', 'fr'] as Lang[]).map(l => `<a href="/login?lang=${l}"${l === lang ? ' aria-current="true"' : ''} lang="${l}">${l.toUpperCase()}</a>`).join('');
  return `<!doctype html><html lang="${lang === 'pt' ? 'pt-BR' : lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>${t.title} · 4V Documentos</title><link rel="manifest" href="/manifest.webmanifest"><link rel="icon" href="/icons/icon-192.png"><link rel="apple-touch-icon" href="/icons/apple-touch-icon.png"><meta name="theme-color" content="#0a0a0a">
<style>
:root{--bg:#fff;--fg:#0a0a0a;--muted:#444;--err:#b00020;--btn-bg:#0a0a0a;--btn-fg:#fff;--logo:none;color-scheme:light}
@media (prefers-color-scheme:dark){:root{--bg:#0a0a0a;--fg:#f5f5f5;--muted:#c4c4c4;--err:#ff9a9a;--btn-bg:#f5f5f5;--btn-fg:#0a0a0a;--logo:invert(1);color-scheme:dark}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:400 20px/1.5 'Atkinson Hyperlegible','Segoe UI',Roboto,Arial,sans-serif}
main{max-width:460px;margin:0 auto;padding:24px 16px 48px}
.top{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:28px}
.brand{display:flex;align-items:center;gap:10px;font:800 20px/1 Arial,sans-serif}.brand img{width:44px;height:44px;filter:var(--logo)}
.lang{display:flex;border:2px solid var(--fg);border-radius:12px;overflow:hidden}.lang a{min-width:50px;min-height:48px;display:grid;place-items:center;font-weight:700;text-decoration:none;color:inherit}.lang a+a{border-left:2px solid var(--fg)}.lang a[aria-current]{background:var(--btn-bg);color:var(--btn-fg)}
h1{font:800 34px/1.15 Arial,sans-serif;margin:0 0 8px}p{margin:0 0 20px}
label{display:block;font-weight:700;margin-bottom:8px}
input[type=password],input[type=text]{display:block;width:100%;min-height:64px;padding:12px 16px;border:2px solid var(--fg);border-radius:12px;background:var(--bg);color:var(--fg);font:inherit;font-size:24px}
.chk{display:flex;gap:12px;align-items:center;min-height:56px;margin:8px 0 16px;font-weight:400}.chk input{width:28px;height:28px;accent-color:var(--fg)}
button{display:block;width:100%;min-height:64px;border:2px solid var(--fg);border-radius:12px;background:var(--btn-bg);color:var(--btn-fg);font-family:inherit;font-size:24px;font-weight:700;cursor:pointer}
:focus-visible{outline:3px solid var(--fg);outline-offset:3px}.err{color:var(--err);font-weight:700}
</style></head><body><main>
<div class="top"><div class="brand"><img src="/icons/logo.png" alt="" width="44" height="44"><span>4V Documentos</span></div><nav class="lang" aria-label="Idioma / Language / Langue">${langs}</nav></div>
<h1>${t.title}</h1><p>${t.lead}</p>${err}
<form method="post" action="/login?lang=${lang}">
<label for="password">${t.pw}</label>
<input id="password" name="password" type="password" autocomplete="current-password" autocapitalize="none" autocorrect="off" spellcheck="false" required autofocus>
<label class="chk" for="show"><input type="checkbox" id="show" onchange="document.getElementById('password').type=this.checked?'text':'password'">${t.show}</label>
<button type="submit">${t.btn}</button>
</form></main></body></html>`;
}
