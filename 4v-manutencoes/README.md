# 4V Manutencoes: public website + private document app

Built from `HANDOVER.md` (read it first). Project rules for Claude Code are in `CLAUDE.md`.
Everything here is **free**: GitHub, Cloudflare Pages + Functions, Web3Forms and open-source libraries. Nothing needs a card.

| | Public website | Private document app |
|---|---|---|
| Folder | `apps/site` (Astro, static) | `apps/app` (Vite, vanilla JS) |
| Address | https://4vmanutencoes.pages.dev | https://4v-documentos.pages.dev |
| Pages project | `4vmanutencoes` | `4v-documentos` |
| Indexed? | Yes: sitemap, hreflang, JSON-LD | No: password gate, `noindex`, robots `Disallow: /` |

Shared code:
- `packages/brand/site.config.ts`: **every business fact and URL** (name, CNPJ, phone, e-mail, address, cities, `SITE_URL`). Change facts only here.
- `packages/brand`: fonts (self-hosted, SIL OFL), colour tokens, logo, portrait.
- `packages/docs-core`: document wording PT/EN/FR, the block model, amount in words, HTML/text/DOCX renderers. Its output is byte-identical to the original prototype.

## Commands (run in this folder)

```bash
npm install                 # once
npm test                    # vitest: docs-core (103) + password gate (12)
npm run test:e2e            # Playwright at 390×844: app (7) + site (43, incl. SEO checks on every page)
npm run build               # both apps → apps/app/dist and apps/site/dist
npm run dev:site            # http://localhost:4321
npm run dev:app             # http://localhost:5173 (without the password gate)
npm run dev:pages -w @4v/app  # app WITH the gate, in Cloudflare's runtime (needs apps/app/.dev.vars)
npm run hash-password       # makes APP_PASSWORD_HASH + SESSION_SECRET for the app
```

In a Claude Code cloud session, Playwright uses the preinstalled Chromium. On your own computer, run `npx playwright install chromium` once.

---

## Launch in one command (recommended)

On any computer with Node 22 and git (Mac, Windows/WSL or Linux), from a clone of the repo on this branch:

```bash
bash 4v-manutencoes/scripts/launch.sh
```

It installs, runs the tests, logs you in to Cloudflare in the browser (once), creates both free Pages projects, asks for Valdir's password and stores only its hash as an encrypted secret, deploys both apps with direct upload, and smoke-tests the live URLs. It is safe to re-run; `ROTATE=1 bash …/launch.sh` changes the password and logs out every phone.
Headless alternative: set `CLOUDFLARE_API_TOKEN` (permission *Account → Cloudflare Pages → Edit*) and `CLOUDFLARE_ACCOUNT_ID`, plus `APP_PASSWORD`.

Direct upload means a later code change goes live by re-running the script. If you'd rather have every push deploy automatically, use the Git setup below instead.

## Deploy with Git integration (auto-deploy on push)

The code is in the `4v-manutencoes/` folder of the `andrewlekowski/Aurora-and-Cedar` repo. Merge the branch to `main` first (or pick the branch as the production branch below).

### 1. Public website → `4vmanutencoes.pages.dev`

Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** → pick `Aurora-and-Cedar`.

| Setting | Value |
|---|---|
| Project name | `4vmanutencoes` (if it's taken, use `4v-manutencoes` and change `SITE_URL` in `site.config.ts`) |
| Production branch | `main` |
| Framework preset | None |
| Root directory | `4v-manutencoes` |
| Build command | `npm run build:site` |
| Build output directory | `apps/site/dist` |
| Environment variables | `NODE_VERSION` = `22` |

Optional variables (or set them in `site.config.ts` → `INTEGRATIONS`):
`PUBLIC_WEB3FORMS_KEY`, `PUBLIC_CF_ANALYTICS_TOKEN`, `PUBLIC_GOOGLE_SITE_VERIFICATION`, `PUBLIC_BING_SITE_VERIFICATION`.

Optional: under **Settings → Build watch paths**, include only `4v-manutencoes/*` so Aurora & Cedar commits don't trigger builds (you get 500 builds/month).

### 2. Document app → `4v-documentos.pages.dev`

Create a **second** Pages project from the same repo:

| Setting | Value |
|---|---|
| Project name | `4v-documentos` |
| Production branch | `main` |
| Framework preset | None |
| Root directory | `4v-manutencoes/apps/app` (Cloudflare finds the password gate in `functions/` here) |
| Build command | `cd ../.. && npm ci && npm run build:app` |
| Build output directory | `dist` |
| Environment variables | `NODE_VERSION` = `22`, `SKIP_DEPENDENCY_INSTALL` = `true` |

`SKIP_DEPENDENCY_INSTALL` is needed because the app's `package.json` uses workspace packages; the build command installs from the monorepo root instead.

**Secrets (required, the app refuses to open without them):**
1. On your computer, in this folder: `npm run hash-password`. Type Valdir's password (for example three Portuguese words). The script prints two lines.
2. Pages project `4v-documentos` → **Settings → Variables and secrets** → add both as **Secret** (encrypted), for Production *and* Preview:
   - `APP_PASSWORD_HASH` = the `pbkdf2-sha256$100000$…` line
   - `SESSION_SECRET` = the long random line (at least 32 characters)
3. Redeploy (Deployments → ⋯ → Retry deployment).

How the gate works (`functions/_middleware.ts`, `server/auth.ts`):
- Every file except the login page, the manifest, the icons and `robots.txt` needs a valid `v4session` cookie: an HMAC-SHA256-signed expiry, `HttpOnly; Secure; SameSite=Lax`, valid for **1 year**, so Valdir logs in once per phone.
- The password is checked against a PBKDF2-SHA256 hash (100,000 iterations, the Workers maximum) in constant time. 5 wrong tries from one IP lock it for 5 minutes.
- **Log out every device:** change `SESSION_SECRET` and redeploy. **Change the password:** run `npm run hash-password` again and replace `APP_PASSWORD_HASH`.
- With no secrets set, the app shows "O acesso ainda não foi configurado" and serves nothing.
- Every response has `X-Robots-Tag: noindex, nofollow`. The public site never links to the app; the app links to the site ("Ver meu site").

**If the Git build ever fails**, deploy from your computer instead (free, no card). Run wrangler from `apps/app` so it uploads the `functions/` gate too:
```bash
npx wrangler login
npm run build:app
cd apps/app && npx wrangler pages deploy dist --project-name 4v-documentos
```

### 3. Put the app on Valdir's phone
1. Open https://4v-documentos.pages.dev in Chrome (Android) or Safari (iPhone), type the password and let the phone save it.
2. The home screen shows a card "Coloque o app na tela inicial" with the steps. On Android Chrome there is an "Instalar agora" button.
3. Make one test document and tap **Enviar pelo WhatsApp**. The phone's share sheet opens with the PDF attached; pick WhatsApp and the contact.
4. Show him **Meus dados → Fazer cópia de segurança** (clients and company data live only on the phone).

### 4. Contact form (Web3Forms)
1. Go to https://web3forms.com, enter `4Vmanutencoes@gmail.com`, and confirm the e-mail. You get an access key (it's public by design).
2. Put it in `INTEGRATIONS.web3formsKey` in `packages/brand/site.config.ts` (or the `PUBLIC_WEB3FORMS_KEY` variable) and redeploy. **Until a key is set, the form is hidden** and pages show only the WhatsApp and e-mail buttons.
3. Send one test message from `/contato`: you should land on `/obrigado` and get the e-mail.
Spam protection: Web3Forms honeypot (`botcheck`) plus a 3-second "too fast" check in the page. The form still works without JavaScript (plain POST, then a redirect to `/obrigado`).

### 5. Analytics and search engines
- **Cloudflare Web Analytics** (free, no cookies, no LGPD banner): Analytics → Web Analytics → add site → copy the token into `cfAnalyticsToken`.
- **Google Search Console:** add the URL-prefix property `https://4vmanutencoes.pages.dev/` → HTML tag method → copy the `content` value into `googleSiteVerification` → deploy → Verify → submit `sitemap-index.xml`.
- **Bing Webmaster Tools:** import from Search Console, or use the `msvalidate.01` tag (`bingSiteVerification`).
- Conversions: the WhatsApp, e-mail and phone buttons carry `data-track="whatsapp_click" | "email_click" | "phone_click"`. Cloudflare Web Analytics has no custom events, so these are forwarded only if Zaraz or GA4 is added later (neither is on now: no cookies). The practical measure today: each page pre-fills a **different WhatsApp message** ("…preciso de manutenção em uma autoclave"), so Valdir can see which page each lead came from.

### 6. Custom domain later (optional, ~R$40/yr)
Register e.g. `4vmanutencoes.com.br`, add it under the Pages project → Custom domains, change `SITE_URL` in `site.config.ts`, redeploy, and add a free Bulk Redirect from the `pages.dev` address so old links 301 to the new domain.

---

## Before launch: open questions (HANDOVER §8)

- ✅ **Address** confirmed current and OK to show (Rua São Marcos, 126 – Jardim São José, Jacareí – SP, CEP 12327-668).
- ✅ **Service area:** the city of São Paulo and Greater São Paulo (confirmed), plus Jacareí, São José dos Campos, Caraguatatuba, Ubatuba, Vale do Paraíba and Litoral Norte (past work). Edit `BUSINESS.areaServed` and the areas text in `apps/site/src/content/{pt,en,fr}.ts` if this changes.
- Business hours → `BUSINESS.openingHours`. Map coordinates → `BUSINESS.geo`.
- Brands he services → the dental FAQ currently says "tell us the brand"; once confirmed, brand names can be added as keywords.
- Other equipment (fluxo laminar, centrífugas, banho-maria, compressores)? Each confirmed "yes" can become a page.
- Real job photos (with client permission).

## Things to know

- **Document wording** (`packages/docs-core/src/doct.js`) is unchanged from the reviewed prototype. *It should be reviewed once by a Brazilian lawyer or accountant before relying on it.* (This note is intentionally kept out of the documents themselves.)
- **Original Word files** from `reference/original-docs/` in the handover zip were **not committed**: they contain a client's name and address. Keep them outside the repo.
- **University names** appear as text only. No university logos (trademarks) are used.
- **Icons:** the app icons are upscaled from the 240-px logo. If a larger or vector version of the Vitruvian Man logo turns up, replace `packages/brand/assets/logo_k.png` and rerun the icon step (see `apps/app/public/icons`) and `npm run og -w @4v/site`.
- **html2pdf.js 0.10.1** (pinned per the handover) pulls in an older DOMPurify that `npm audit` flags. Only the app's own escaped HTML is rendered, behind the login, so the risk is low; upgrading html2pdf.js is a possible follow-up once PDFs are re-checked.
- The app's "install on home screen" card gives written steps. It doesn't have real phone screenshots yet; add them if Valdir gets stuck.
- Off-site copy (Google Business Profile, WhatsApp Business, business card) is drafted in `docs/off-site-copy.md`.
