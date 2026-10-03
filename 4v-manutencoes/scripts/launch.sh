#!/usr/bin/env bash
# Launch 4V Manutencoes on Cloudflare Pages (free). Run from anywhere:
#   bash 4v-manutencoes/scripts/launch.sh
#
# Auth, either:
#   - on your computer: nothing to set, wrangler opens the browser to log in once; or
#   - headless: export CLOUDFLARE_API_TOKEN (Account → Cloudflare Pages: Edit) and CLOUDFLARE_ACCOUNT_ID.
# Valdir's password: export APP_PASSWORD="três palavras aqui", or type it when asked (never stored, only its hash).
# Safe to re-run: existing projects are reused; secrets are only set when missing or when ROTATE=1.
set -euo pipefail
cd "$(dirname "$0")/.."

SITE_PROJECT=4vmanutencoes
APP_PROJECT=4v-documentos
WR="npx --yes wrangler@4"

say() { printf '\n\033[1m== %s\033[0m\n' "$*"; }

say "Install and test"
npm ci
npm test

say "Cloudflare login"
if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then $WR whoami 2>/dev/null | grep -q "associated with" || $WR login; fi
$WR whoami

say "Create Pages projects (skipped if they exist)"
LIST=$($WR pages project list 2>/dev/null || true)
for p in "$SITE_PROJECT" "$APP_PROJECT"; do
  if grep -qE "(^|[^a-z0-9-])$p([^a-z0-9-]|$)" <<<"$LIST"; then echo "exists: $p"
  else $WR pages project create "$p" --production-branch main; fi
done
EXPECTED=$(node -e "import('./packages/brand/site.config.ts').then(m=>console.log(new URL(m.SITE_URL).host))")
if ! $WR pages project list | grep -q "$EXPECTED"; then
  echo "WARNING: no project is served at $EXPECTED. Put the site's real *.pages.dev address in SITE_URL"
  echo "         (packages/brand/site.config.ts), commit, and re-run this script."
fi

say "Password gate secrets for $APP_PROJECT"
HAS=$($WR pages secret list --project-name "$APP_PROJECT" 2>/dev/null || true)
if [ "${ROTATE:-0}" = 1 ] || ! grep -q APP_PASSWORD_HASH <<<"$HAS"; then
  if [ -z "${APP_PASSWORD:-}" ]; then read -rsp "Password for Valdir (8+ chars, e.g. three words): " APP_PASSWORD; echo; fi
  OUT=$(PASSWORD="$APP_PASSWORD" node apps/app/scripts/hash-password.mjs)
  grep '^APP_PASSWORD_HASH=' <<<"$OUT" | cut -d= -f2- | $WR pages secret put APP_PASSWORD_HASH --project-name "$APP_PROJECT"
  grep '^SESSION_SECRET=' <<<"$OUT" | cut -d= -f2- | $WR pages secret put SESSION_SECRET --project-name "$APP_PROJECT"
  unset APP_PASSWORD OUT
else echo "secrets already set (ROTATE=1 to change the password and log out every phone)"; fi

say "Build and deploy the public site"
npm run build:site
node apps/site/scripts/check-content.mjs
$WR pages deploy apps/site/dist --project-name "$SITE_PROJECT" --branch main --commit-dirty=true

say "Build and deploy the document app (with the password gate in functions/)"
npm run build:app
( cd apps/app && $WR pages deploy dist --project-name "$APP_PROJECT" --branch main --commit-dirty=true )

say "Smoke test"
SITE="https://$EXPECTED"; APP="https://$APP_PROJECT.pages.dev"
sleep 5
code() { curl -s -o /dev/null -w '%{http_code}' -H 'Accept: text/html' "$1"; }
printf 'site /                         %s (want 200)\n' "$(code "$SITE/")"
printf 'site /manutencao-de-autoclave  %s (want 200)\n' "$(code "$SITE/manutencao-de-autoclave")"
printf 'site /sitemap-index.xml        %s (want 200)\n' "$(code "$SITE/sitemap-index.xml")"
printf 'app  / without login           %s (want 401 = login page)\n' "$(code "$APP/")"
printf 'app  /manifest.webmanifest     %s (want 200)\n' "$(code "$APP/manifest.webmanifest")"
echo
echo "Done. Site: $SITE   App: $APP"
echo "Next in README: '3. Put the app on Valdir's phone', '4. Contact form', '5. Analytics and search engines'."
