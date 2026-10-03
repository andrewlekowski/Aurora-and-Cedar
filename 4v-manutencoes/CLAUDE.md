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

## Repo notes
- This monorepo lives in the `4v-manutencoes/` folder of Andrew's Aurora-and-Cedar repo. Run every command from this folder.
- `npm install` once, then: `npm test` (vitest), `npm run test:e2e` (Playwright, 390×844), `npm run build`.
- Playwright: use the preinstalled Chromium (`/opt/pw-browsers`); never run `playwright install` in cloud sessions.
- `prototype/` is the original single-file prototype, kept only for reference. Do not edit it.
- CNPJ 21.914.770/0001-10 is approved by Andrew for the public website.
