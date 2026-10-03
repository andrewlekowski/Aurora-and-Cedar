# HANDOVER — 4V Manutencoes website + private document app

**Owner:** Andrew Lekowski (building this for his father-in-law, Valdir de Paula Bicudo)
**Prepared:** 2 Oct 2026
**Read this whole file before writing code. Put it in the repo root as `HANDOVER.md`, and copy section 9 into `CLAUDE.md`.**

---

## 0. Zero-cost rule (non-negotiable)
Valdir will not pay anything for this website. **Every tool, host, form and listing below is free, with no credit card required.** If a step would require payment or a card on file, stop and propose a free alternative instead.

| Need | Free solution |
|---|---|
| Code hosting | GitHub (free account, private repo OK) |
| Website hosting + HTTPS + CDN | **Cloudflare Pages** free plan (unlimited sites, unlimited bandwidth, 500 builds/month) |
| Web address | **`https://4vmanutencoes.pages.dev`**, a free subdomain carrying the business name. No domain purchase. (Pages names are first-come; if taken, use `4v-manutencoes` and update `SITE_URL`.) |
| Document app address | **`https://4v-documentos.pages.dev`** (second free Pages project) |
| Protecting the document app | Cloudflare **Pages Functions** password middleware (free tier: 100,000 requests/day) |
| Email contact form | **Web3Forms** free plan (250 submissions/month, no backend, delivers to Gmail), plus a plain `mailto:` button |
| WhatsApp contact | `wa.me` link (free) |
| Fonts, libraries | Self-hosted open-source (Archivo, Atkinson Hyperlegible: SIL OFL; html2pdf.js, docx: MIT) |
| Analytics | Cloudflare Web Analytics (free) + Google Search Console (free) + Bing Webmaster Tools (free) |
| Local visibility | Google Business Profile, Bing Places, Apple Business Connect, Facebook Page, WhatsApp Business: all free |

**Upgrade path, only if he ever chooses:** a custom domain (e.g. `4vmanutencoes.com.br`, ~R$40/yr at Registro.br) can be pointed at the same Pages project later without rebuilding. Keep every absolute URL in one config value (`SITE_URL`) so the switch is a one-line change plus 301 redirects.

---

## 1. What we are building

We are building two separate products from one repo.

| | **A. Public website** | **B. Private document app** |
|---|---|---|
| Purpose | Google traffic → WhatsApp leads | Valdir fills in contracts, warranty terms and receipts, then downloads or shares them |
| Audience | Hospitals, clinics, dental offices, labs, universities, city halls in São Paulo state | Valdir only (and Andrew as admin) |
| URL | `https://4vmanutencoes.pages.dev` (free) | `https://4v-documentos.pages.dev` (free) |
| Indexing | Fully indexed, SEO-optimized | **Not indexed**: `noindex`, robots disallow, behind login |
| Languages | PT-BR (default, `/`), EN (`/en/`), FR (`/fr/`), each pre-rendered as its own URL | PT/EN/FR toggle (already built) |

**Why they are separate:** the document app must never be reachable without login. It also must not leak into Google, and its JavaScript weight must not slow the public site. The current prototype is one file with hash routes (`#site`, `#inicio`…). That is fine inside Claude, but it is bad for SEO and can't be protected, so we split it.

### The user (critical design constraint)
Valdir is 60+ and uses **only his phone**. He has trouble navigating the internet. Every screen needs:
- base font 19px+, buttons 56px+ tall
- plain Portuguese and no jargon
- one obvious action per screen

Test everything at 360–400px wide first.

---

## 2. What already exists (in this package)

```
prototype/
  index.html        ← the full working prototype (single file, 205 KB, images inlined)
  src/              ← its sources: i18n.js (UI strings PT/EN/FR), doct.js (document text PT/EN/FR),
                      docs.js (document builders → block model), ext.js (amount-in-words PT/EN/FR),
                      core.js, views.js, style.css, shell.html
  build.py          ← concatenates src/ + inlines images → index.html
  SPEC.md           ← the original functional spec (doc wording, fields, presets)
assets/
  logo_k.png        ← Vitruvian Man, black ink, transparent, 240px (the brand mark)
  valdir_bw.jpg     ← grayscale portrait, 560px
reference/
  business-profile.md            ← finalized brand facts and what must NOT be claimed
  original-docs/                 ← Valdir's original Word files (for comparison)
```

Live prototype (Claude artifact, private): `https://claude.ai/artifact/53nCpJipize9suYzSKQ3xz`

### Prototype behavior to preserve
- **4 documents:**
  - Termo de Garantia (prefix G)
  - Termo de Entrega e Orientações (E)
  - Contrato de Compra e Venda de Equipamento (C)
  - Recibo (R)
- All documents are built from one **block model**, which renders to the HTML preview, PDF (html2pdf.js 0.10.1), DOCX (docx 8.5.0) and plain text for WhatsApp.
- Empty field ⇒ prints a `________` line, so Valdir can fill it in by hand.
- **Warranty:** chips for 3 months (minimum, default), 6, 12 or another term. Every document states that warranty service is free of charge.
- Amount in words in PT/EN/FR (tested: "mil e duzentos reais", "soixante et onze", "quatre-vingts"…).
- Saved clients, company data ("Meus dados"), drafts and doc counters are stored in `localStorage`.
- **Equipment-type orientation presets for the Entrega doc:** autoclave, dental, estufa, gas-exhaust hood, biosafety cabinet, other.

### Prototype pieces that are Claude-specific and must be replaced
- `window.claude.use("downloads")` → replace with native download + Web Share (section 5.3).
- Hash routing → real routes.
- Remove all `window.claude` references.
- Google Fonts CDN → self-host Archivo and Atkinson Hyperlegible (woff2, subset latin + latin-ext).
- jsDelivr CDN libs → npm dependencies, bundled and lazy-loaded.

---

## 3. Recommended stack and hosting (100% free)

| Need | Choice | Why |
|---|---|---|
| Public site | **Astro** (static output) with `@astrojs/sitemap` and built-in i18n routing | Zero JS by default; fast Core Web Vitals; easy per-page SEO; pre-rendered PT/EN/FR |
| Doc app | Vite + vanilla JS/TS (port `src/` modules nearly as-is) or an Astro island under `apps/app` | Keep it simple; no framework needed |
| Hosting | **Cloudflare Pages**: two projects from one monorepo (`apps/site`, `apps/app`) | Free, global CDN, preview deploys |
| Protection for the app | Pages Functions middleware: password page + signed cookie (see §4) | Real server-side gate, free, no card |
| Address | `4vmanutencoes.pages.dev` (business name, free). Custom domain optional later (§0). | Pages subdomains are indexed by Google like any site; content and local signals drive ranking, not the TLD |
| Analytics | Cloudflare Web Analytics (cookieless, no LGPD banner needed) + Google Search Console. Do not add GA4 or other cookie-setting trackers (avoids an LGPD cookie banner). | |

Repo layout:
```
/apps/site   (Astro → Pages project `4vmanutencoes`)       /apps/app   (Vite → Pages project `4v-documentos`)       /packages/brand (logo, fonts, tokens.css)
/packages/docs-core (block model, amount-in-words, document text — shared, tested)
```

---

## 4. Protecting the document app (free: password gate in a Pages Function)

A JavaScript-only password is **not** protection, because the files ship to anyone with the URL. The check must run on the server before any file is served. Cloudflare Pages Functions do this for free.

Implementation (`apps/app/functions/_middleware.ts`):
1. Every request except `/login` and `/login.css` checks a cookie `v4session`, an HMAC-SHA256-signed token (`expiry.signature`) using secret `SESSION_SECRET`.
2. Missing or invalid cookie → serve `/login`: one big password field, one big button "Entrar", in PT/EN/FR, large type.
3. `POST /login` compares (constant-time) against `APP_PASSWORD_HASH` (PBKDF2/SHA-256 of the password, generated once by Andrew with a provided script). On success it sets the cookie `HttpOnly; Secure; SameSite=Lax; Max-Age=31536000` (**1 year**, so Valdir logs in once per phone) and redirects to `/`.
4. Rate-limit by IP: a simple in-memory counter is fine on free; on 5 failures, wait 5 minutes.
5. "Sair" button clears the cookie. Andrew can force-logout every device by rotating `SESSION_SECRET` in the Pages dashboard.
6. Secrets (`APP_PASSWORD_HASH`, `SESSION_SECRET`) are set as encrypted environment variables in the Pages project. They never go in the repo.
7. Send `X-Robots-Tag: noindex, nofollow` on every response (`_headers`), and `robots.txt` with `Disallow: /`.
8. The public site does **not** link to the app. Valdir opens it from a home-screen icon (PWA, §5.4).

Password choice: Andrew picks a memorable passphrase for Valdir (e.g. three Portuguese words), writes it down for him once, and saves it to Valdir's phone password manager or browser.

Alternative if Andrew prefers sign-in with Google: Cloudflare Zero Trust Access (free ≤ 50 users) in front of `4v-documentos.pages.dev`. Only use it if the Zero Trust sign-up does not demand a payment card on that account; otherwise keep the middleware.

Optional phase 2 (still free): sync saved clients across devices with **Cloudflare D1** (free tier) via a Pages Function behind the same middleware. Until then, add "Fazer cópia de segurança" (export JSON) / "Restaurar cópia" buttons, because `localStorage` is lost if he changes phones.

---

## 5. Document app — work items

5.1 Port `prototype/src` into `apps/app`, remove the `#site` view and the "Ver meu site" tile now links to the public URL.
5.2 Self-host fonts; bundle html2pdf.js and docx as lazy chunks (load on first download tap).
5.3 **Downloads/sharing (biggest UX win on his phone):**
   - Primary button **"Enviar pelo WhatsApp"**: `navigator.canShare({files:[pdfFile]})` → `navigator.share({files, title})`. This opens the phone share sheet with the PDF attached, so he picks WhatsApp and the client.
   - Secondary: "Baixar PDF", "Baixar Word" via `URL.createObjectURL` + `<a download>`.
   - Keep "Copiar texto".
5.4 **PWA:** manifest (name "4V Documentos", icon = logo on white, `display: standalone`, `start_url: /`), plus a simple service worker caching the app shell and libs so it opens fast and works with weak signal. Add a one-time card explaining "Adicionar à tela inicial" with screenshots for Android Chrome and iPhone Safari.
5.5 Keep every document wording exactly as in `src/doct.js` (already reviewed). Add a footer note in Andrew's admin README only, not on the documents: *wording should be reviewed once by a Brazilian lawyer/accountant.*
5.6 Unit tests (Vitest) for `extenso()` in PT/EN/FR (cases listed in SPEC.md), `parseMoney()`, and each document builder (snapshot of block output with full data and with empty data).
5.7 Playwright tests at 390×844: fill the contract, generate PDF and DOCX, assert non-empty blobs, no horizontal scroll, no console errors.

---

## 6. Public website — SEO specification

### 6.1 Ground rules (do not break)
- Brand name is spelled exactly **4V Manutencoes**, without accents (finalized brand decision). Body copy may use correct Portuguese ("manutenções") elsewhere.
- **Only use confirmed facts** (section 7). Never invent: years of experience beyond "desde 2015", certifications, CREA, team size, prices, response times, testimonials, client logos.
- Visual brand: black & white only, modern sans-serif (Archivo display + Atkinson Hyperlegible body), Vitruvian Man watermark at ~15% opacity, no icons/emoji clutter. Reuse `prototype/src/style.css` tokens.
- **Two contact paths on every page: WhatsApp and email.**
  - WhatsApp: big black button → `https://wa.me/5512997881836?text=<prefilled per page>`.
  - Email: outlined button "Enviar e-mail" → `mailto:4Vmanutencoes@gmail.com?subject=<per page, e.g. 'Orçamento – manutenção de autoclave'>` **plus** the address shown as selectable text.
  - **Contact form** on `/contato` and at the bottom of each service page: Nome, Empresa/Instituição, Cidade, Telefone/WhatsApp, E-mail, Equipamento (marca/modelo), Mensagem. Submit to **Web3Forms** (`https://api.web3forms.com/submit`, free access key tied to 4Vmanutencoes@gmail.com; the key is public by design). Use their honeypot field plus a simple time-on-page check against spam. Show an inline success message: "Mensagem enviada. O Valdir vai responder pelo e-mail ou WhatsApp." Works without JS, as a plain HTML form POST with a redirect to `/obrigado`.
  - Mobile sticky bottom bar with two buttons: **WhatsApp | E-mail**.
- **Primary conversion is the WhatsApp click** (`https://wa.me/5512997881836?text=<prefilled per page>`). Put it in the hero, on every service page, and as a sticky bottom bar on mobile.

### 6.2 Site map, URLs, titles and meta (PT shown; EN/FR mirror under `/en/`, `/fr/` with translated slugs)

| URL | `<title>` (≤ 60 chars) | Meta description (≤ 155) | H1 |
|---|---|---|---|
| `/` | Manutenção de Equipamentos Médicos e de Laboratório \| 4V | Manutenção corretiva e preventiva de autoclaves, estufas, capelas e equipamentos odontológicos em Jacareí e região. Garantia por escrito. Chame no WhatsApp. | Manutenção de equipamentos médicos, laboratoriais e odontológicos |
| `/manutencao-de-autoclave` | Manutenção e Conserto de Autoclave em Jacareí \| 4V | Conserto e manutenção preventiva de autoclaves hospitalares, odontológicas e de laboratório. Garantia mínima de 3 meses. Atendimento pelo WhatsApp. | Manutenção e conserto de autoclave |
| `/manutencao-de-equipamentos-odontologicos` | Manutenção de Cadeira e Equipo Odontológico \| 4V | Conserto de equipo, cuspideira, seringa tríplice, alta rotação e micromotor. Manutenção preventiva para consultórios. Garantia por escrito. | Manutenção de equipamentos odontológicos |
| `/manutencao-de-estufa-de-laboratorio` | Manutenção de Estufa de Laboratório e Secagem \| 4V | Manutenção corretiva e preventiva de estufas de laboratório, secagem e esterilização. Garantia mínima de 3 meses em todos os serviços. | Manutenção de estufas de laboratório |
| `/manutencao-de-capela-de-exaustao` | Manutenção de Capela / Cabine de Exaustão de Gases \| 4V | Manutenção de capelas e cabines de exaustão de gases para laboratórios e universidades. Corretiva e preventiva, com garantia. | Manutenção de capela de exaustão de gases |
| `/manutencao-de-cabine-de-seguranca-biologica` | Manutenção de Cabine de Segurança Biológica \| 4V | Manutenção de cabines de segurança biológica e equipamentos de biossegurança para laboratórios. Garantia por escrito. | Manutenção de cabine de segurança biológica |
| `/manutencao-de-equipamentos-hospitalares` | Manutenção de Equipamentos Médico-Hospitalares \| 4V | Manutenção de autoclaves, bombas de vácuo, cardioversores e equipamentos hospitalares. Experiência com setor público e universidades. | Manutenção de equipamentos médico-hospitalares |
| `/instalacao-e-remanejamento-de-equipamentos-de-laboratorio` | Instalação e Remanejamento de Equipamentos de Laboratório | Desinstalação, mudança e reinstalação de equipamentos de laboratório. Experiência com USP, UNESP e Unifesp. | Instalação e remanejamento de equipamentos de laboratório |
| `/experiencia` | Experiência e Clientes: USP, UNESP, Unifesp \| 4V Manutencoes | Atendimento a universidades públicas e prefeituras desde 2015. Conheça a experiência da 4V Manutencoes. | Experiência e principais clientes |
| `/areas-atendidas` | Áreas Atendidas: Jacareí, São José dos Campos e Região \| 4V | Manutenção de equipamentos médicos e de laboratório em Jacareí, Vale do Paraíba e Litoral Norte de SP. | Áreas atendidas |
| `/contato` | Contato: WhatsApp e E-mail \| 4V Manutencoes | Fale pelo WhatsApp (12) 99788-1836 ou e-mail 4Vmanutencoes@gmail.com. Formulário de orçamento. Jacareí – SP. | Fale com a 4V Manutencoes |
| `/obrigado` (noindex) | Mensagem enviada \| 4V Manutencoes | — | Mensagem enviada |

Each service page has:
- H1
- two to three short paragraphs: what is serviced, typical problems, corrective vs preventive
- "Problemas comuns que atendemos" list (problem-phrase content captures long-tail searches)
- warranty block
- 3–5 FAQ items
- WhatsApp CTA with a page-specific prefilled message
- internal links to two related service pages and `/experiencia`

Target 400–700 words of real, plain content per page. **Do not create one page per city** (doorway pages get penalized). Use one `/areas-atendidas` page that lists cities in prose.

### 6.3 Keyword map (Portuguese, high purchase intent)
These are chosen from the services he performs plus local modifiers. **Validate volumes in Google Keyword Planner and Search Console after launch**; no paid volume data was available when this was written.

| Page | Primary | Secondary / long-tail |
|---|---|---|
| Home | manutenção de equipamentos médicos | manutenção de equipamentos de laboratório; assistência técnica equipamentos hospitalares; manutenção preventiva e corretiva equipamentos médicos; manutenção equipamentos médicos Jacareí / São José dos Campos / Vale do Paraíba |
| Autoclave | manutenção de autoclave | conserto de autoclave; assistência técnica autoclave; autoclave não esquenta; autoclave não pressuriza; autoclave vazando vapor; troca de borracha de vedação autoclave; manutenção autoclave odontológica; autoclave Jacareí / São José dos Campos |
| Odonto | manutenção de cadeira odontológica | conserto de equipo odontológico; conserto cuspideira; manutenção caneta de alta rotação; micromotor odontológico conserto; técnico equipamento odontológico; assistência Dabi Atlante (only if Valdir confirms brand list) |
| Estufa | manutenção de estufa de laboratório | conserto de estufa de secagem; estufa de esterilização conserto; estufa não aquece; termostato estufa |
| Capela | manutenção de capela de exaustão | cabine de exaustão de gases manutenção; capela química manutenção; exaustor de capela laboratório |
| Biossegurança | manutenção cabine de segurança biológica | equipamentos de biossegurança manutenção; cabine de fluxo laminar manutenção (only if confirmed) |
| Hospitalar | manutenção de equipamentos hospitalares | bomba de vácuo manutenção; manutenção cardioversor; manutenção preventiva equipamentos hospitalares; empresa de manutenção hospitalar |
| Lab moving | remanejamento de equipamentos de laboratório | mudança de laboratório; instalação de equipamentos de laboratório; desinstalação de equipamentos laboratório universidade |

**Local modifiers** (use naturally in copy, the areas page and schema `areaServed`):
- **Evidenced by his past work:** Jacareí, São José dos Campos, Caraguatatuba, Ubatuba
- **Confirm with Valdir:** Taubaté, Caçapava, Pindamonhangaba, São Sebastião, Ilhabela, Guararema, Santa Branca, Mogi das Cruzes, the city of São Paulo (USP/Unifesp campuses), Vale do Paraíba, Litoral Norte

EN/FR pages will get little Brazilian search traffic. They exist for credibility with international researchers at the universities. Give them correct `hreflang`, but don't spend effort on EN/FR keyword research.

### 6.4 Technical SEO checklist
- [ ] Static HTML per page and per language; no client-side rendering of content.
- [ ] `<html lang="pt-BR">` (`en`, `fr`); `hreflang` alternates for pt-BR/en/fr + `x-default` → PT; self-referencing `canonical`.
- [ ] `sitemap.xml` (all languages) + `robots.txt` pointing to it; submit in Google Search Console and Bing Webmaster Tools.
- [ ] Unique title and meta description per page (table above); one H1; logical H2/H3.
- [ ] Open Graph and Twitter tags + a 1200×630 share image (logo + name, B&W) for WhatsApp link previews.
- [ ] **JSON-LD** on every page (template in 6.5). On service pages also add `Service` and `FAQPage`; on all inner pages add `BreadcrumbList`.
- [ ] Images: WebP/AVIF, explicit width/height, descriptive `alt` in each language ("Valdir de Paula Bicudo, técnico da 4V Manutencoes"), lazy-load below the fold.
- [ ] Performance budget: LCP < 2.0s on 4G, CLS < 0.05, total JS on public pages < 15 KB. Self-hosted fonts with `font-display: swap` and preload of the display face.
- [ ] Mobile: tap targets ≥ 48px, sticky WhatsApp bar, phone number as text and `tel:` link.
- [ ] Accessibility: WCAG AA contrast (B&W passes), focus states, skip link.
- [ ] Clean slugs, 301 redirect from `www` → apex (or the reverse; pick one), HTTPS only.
- [ ] Track conversions: Cloudflare Web Analytics custom event or GA4 event `whatsapp_click` / `email_click` / `form_submit` / `phone_click` with page path (Cloudflare Web Analytics custom events, free).

### 6.5 JSON-LD template (fill from `site.config.ts`, single source of truth)
```json
{
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "ProfessionalService"],
  "@id": "https://4vmanutencoes.pages.dev/#business",
  "name": "4V Manutencoes",
  "legalName": "Valdir de Paula Bicudo",
  "taxID": "21.914.770/0001-10",
  "foundingDate": "2015-02-23",
  "description": "Manutenção corretiva e preventiva de equipamentos médicos, laboratoriais e odontológicos.",
  "url": "https://4vmanutencoes.pages.dev/",
  "logo": "https://4vmanutencoes.pages.dev/logo.png",
  "image": "https://4vmanutencoes.pages.dev/og.jpg",
  "telephone": "+55-12-99788-1836",
  "email": "4Vmanutencoes@gmail.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Rua São Marcos, 126 – Jardim São José",
    "addressLocality": "Jacareí",
    "addressRegion": "SP",
    "postalCode": "12327-668",
    "addressCountry": "BR"
  },
  "areaServed": ["Jacareí", "São José dos Campos", "Caraguatatuba", "Ubatuba", "Vale do Paraíba", "Litoral Norte de São Paulo"],
  "founder": {"@type": "Person", "name": "Valdir de Paula Bicudo"},
  "knowsAbout": ["autoclave", "estufa de laboratório", "capela de exaustão de gases", "cabine de segurança biológica", "equipamentos odontológicos", "bomba de vácuo", "cardioversor"],
  "sameAs": ["<Google Business Profile URL>", "<Instagram/Facebook if created>"],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Serviços",
    "itemListElement": [
      {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Manutenção de autoclave"}},
      {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Manutenção de equipamentos odontológicos"}},
      {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Manutenção de estufa de laboratório"}},
      {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Manutenção de capela de exaustão de gases"}},
      {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Manutenção de cabine de segurança biológica"}},
      {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Instalação e remanejamento de equipamentos de laboratório"}}
    ]
  }
}
```
Add `geo` (lat/long) and `openingHoursSpecification` once Valdir confirms them. Validate with Google's Rich Results Test.

### 6.6 Credibility content (the "Experiência" page and home section)
Use exactly these facts; they are confirmed by Andrew or by public records he supplied:
- **Principais clientes — universidades** (show the abbreviation large and the full name below):
  - **USP**: Universidade de São Paulo
  - **UNESP**: Universidade Estadual Paulista "Júlio de Mesquita Filho"
  - **Unifesp**: Universidade Federal de São Paulo
- Empresa ativa desde **2015** (CNPJ 21.914.770/0001-10, opened 23/02/2015).
- Serviços ao setor público:
  - 2018: manutenção de cardioversor (contratação pública)
  - 2021: Prefeitura de Ubatuba, conserto de 3 autoclaves
  - 2024: UNESP, desinstalação, remanejamento e instalação de equipamentos de laboratório
- Listado pela Prismatec como assistência técnica em Jacareí.
- Membro do Conselho Municipal dos Direitos da Pessoa com Deficiência de Jacareí (2019–2021).
- Equipment experience: autoclaves, bombas de vácuo, cardioversores, equipamentos de laboratório, equipamentos odontológicos (Dabi Atlante equipo serviced in 2016), estufas, capelas de exaustão, biossegurança.

**Do not publish:**
- contract values
- the 2014 civil-service exam result
- the Ministério Público procedure in his public-records report

Do **not** use university logos (trademark) without written permission; text names are fine.

### 6.7 FAQ drafts (PT; translate for EN/FR)
1. **Quanto tempo de garantia tem o serviço?** Todos os serviços têm garantia mínima de 3 meses, informada por escrito no termo de garantia. Dependendo do serviço, o prazo pode ser maior.
2. **O atendimento em garantia é cobrado?** Não. O atendimento em garantia não tem custo para o cliente.
3. **Vocês fazem manutenção preventiva?** Sim. A manutenção preventiva revisa o equipamento antes que ele pare, o que reduz o risco de interromper atendimentos e prolonga a vida útil.
4. **Atendem universidades e órgãos públicos?** Sim. A 4V Manutencoes já atendeu USP, UNESP, Unifesp e prefeituras da região.
5. **Como peço um orçamento?** Chame no WhatsApp (12) 99788-1836, envie um e-mail para 4Vmanutencoes@gmail.com ou use o formulário de contato, informe o equipamento, a marca e o modelo e descreva o problema. Se puder, envie uma foto da etiqueta do equipamento.
6. **Recebo documento do serviço?** Sim. Você recebe o termo de garantia e as orientações de uso do equipamento por escrito.

Service-specific FAQ examples:
- Autoclave: "Minha autoclave não está pressurizando. O que pode ser?" Answer generally: vedação, válvula, resistência or sensor, and say a technical evaluation is needed. Do not give repair instructions.

### 6.8 Off-site work that drives most local traffic (Andrew to do; Claude Code can draft the copy)
0. **Everything in this section is free.** Do it in the first week after launch; for a local service business it drives more traffic than the website alone.
1. **Google Business Profile.** This is the #1 lever for "perto de mim" and Maps searches. Create it under 4Vmanutencoes@gmail.com:
   - Category: the closest available to "medical equipment repair", with secondary categories for laboratory equipment and dental equipment repair.
   - If customers don't visit the address, set it up as a **service-area business** (address hidden, cities listed).
   - Add photos of real jobs, the services list, and the website link `https://4vmanutencoes.pages.dev/?utm_source=gbp`.
   - Post a short update every 2–4 weeks (a job done, a preventive-maintenance tip); free, and it keeps the profile active.
   - Ask satisfied clients for **real** Google reviews.
2. **NAP consistency.** The same name, address and phone must appear everywhere: site, GBP, Bing Places, Apple Business Connect, Facebook page, Prismatec listing. The business card currently says "São Paulo, Brazil", so update it to match.
3. **Supplier portals for public buyers:** BEC-SP / Compras.gov.br supplier registration. Universities and city halls buy there; this is lead flow rather than SEO.
4. **WhatsApp Business** profile with the website link and catalog of services.
5. **Free backlinks that help ranking:** ask Prismatec to link their listing to the site; add the site to the Facebook/Instagram bio and the WhatsApp Business profile; add it to the email signature in Gmail; ask the university departments he serves whether a supplier/vendor page can list him (only with their consent).
6. **Business card:** add the website and QR code to the card (the QR can point to the site; the earlier vCard-hosting problem is solved by hosting `/4V_Manutencoes.vcf` on the site with a download link on `/contato`).

---

## 7. Confirmed business facts (single source of truth → `site.config.ts`)

| Field | Value | Status |
|---|---|---|
| Brand | 4V Manutencoes | final |
| Subtitle | Assistência Técnica Especializada | final |
| Legal name | Valdir de Paula Bicudo (ME) | from CNPJ record |
| CNPJ | 21.914.770/0001-10 | public record |
| IE | Isento | from his 2018 contract |
| Address | Rua São Marcos, 126 – Jardim São José, Jacareí – SP, CEP 12327-668 | approved by Andrew for website; confirm still current |
| 2nd address | R. Geraldo Fernandes, 298 – Travessão, Caraguatatuba – SP | from 2018 doc; **confirm before using** |
| WhatsApp | (12) 99788-1836 / +55 12 99788-1836 / `5512997881836` | final |
| Email | 4Vmanutencoes@gmail.com (website mailto + Web3Forms form deliver here) | final |
| Website | https://4vmanutencoes.pages.dev | free subdomain; custom domain optional later |
| Warranty | minimum 3 months on every service; varies above that; warranty service is free | confirmed by Andrew |
| Since | 2015 | public record |
| Key clients | USP, UNESP, Unifesp | confirmed by Andrew |

---

## 8. Open questions for Valdir (block launch only where marked ⛔)
- ⛔ Is the Jacareí address current and OK to show publicly? Is the Caraguatatuba shop still open?
- ⛔ Which cities does he actually serve (to finalize `areaServed` and the areas page)?
- Business hours?
- Brands he services (Dabi Atlante, Sercon, Cristófoli, Gnatus, Kavo…)? This unlocks brand keywords.
- Does he service fluxo laminar, centrífugas, banho-maria, compressores? Each "yes" is a new page or keyword.
- Photos from real jobs (with client permission) for the site and GBP.

---

## 9. CLAUDE.md (paste into repo)
```
# 4V Manutencoes — project rules
- ZERO COST: only free tools/hosting (GitHub, Cloudflare Pages + Functions, Web3Forms, open-source libs). Never add anything that needs payment or a card. Ask Andrew first if unsure.
- Two apps: apps/site (public, Astro, SEO → 4vmanutencoes.pages.dev) and apps/app (private doc tool → 4v-documentos.pages.dev, password-gated by functions/_middleware.ts). Never link site → app.
- Contact = WhatsApp + email (mailto + Web3Forms form) on every public page.
- End user is a 60+ phone-only technician: 19px+ text, 56px+ buttons, plain PT-BR, test at 390px first.
- Brand: "4V Manutencoes" (no accents), black & white only, Archivo + Atkinson Hyperlegible, Vitruvian Man watermark.
- Only publish facts listed in HANDOVER.md §7/§6.6. Never invent experience, certifications, prices or testimonials.
- Business facts live in packages/brand/site.config.ts — never hard-code them in pages.
- Document wording lives in packages/docs-core (from prototype/src/doct.js); change only with Andrew's approval.
- Every PR: unit tests (vitest) + Playwright mobile run green; Lighthouse mobile ≥ 95 performance/SEO/accessibility on public pages.
- All absolute URLs come from SITE_URL in site.config.ts (custom domain may be added later).
```

---

## 10. Suggested build order
1. Monorepo scaffold, brand package (tokens, fonts, logo), `site.config.ts`.
2. `packages/docs-core`: move block model, document text and `extenso` from the prototype; add tests.
3. `apps/app`: port the UI, native share/download, PWA, password middleware. Deploy to Pages project `4v-documentos`, set secrets, test login on a phone.
4. `apps/site`: home + the 7 service pages + experiência + áreas + contato in PT. Add schema, sitemap, OG tags.
5. EN/FR translations of the site with hreflang.
6. Deploy `apps/site` to Pages project `4vmanutencoes` → live at `https://4vmanutencoes.pages.dev`. Verify in Google Search Console (HTML-file or meta-tag method; no DNS needed) and Bing Webmaster Tools, submit the sitemap, create the Google Business Profile, and set up Web3Forms with a test submission.
7. After 4–6 weeks: review Search Console queries and expand pages for the queries that show impressions.
