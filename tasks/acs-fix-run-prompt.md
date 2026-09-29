# Aurora & Cedar Stays — website fix run (Claude Code)

You are fixing auroraandcedarstays.com: WordPress (hello-elementor theme + Elementor), MotoPress Hotel Booking 4.6.0, Stripe, MetForm, on GoDaddy Managed WordPress with CDN/page cache. An outside audit (./audit.md) listed about 28 issues. Verify its claims, build and test the fixes below on staging, then promote what passed to production. The owner is Andrew.

Andrew is present only for Phase 0. After Phase 0 prints "You can walk away", never ask him anything or wait for input. Record anything that needs him in DECISIONS.md and keep going.

## Read first
The repo at ~/aurora-and-cedar (branch claude/aurora-cedar-fixes-q14sph) records earlier work that is **already live**. Read `HANDOVER.md`, `website-fix-log.md` and `wp-content/plugins/acs-site/README.md` before Phase 1. Don't redo or undo that work. In particular:
- The site plugin **ACS Site Customizations (acs-site) 0.2.0** is active on production. It contains:
  - no-cache headers for booking/search/checkout pages
  - noindex on utility pages
  - `[acs_from_price]` (live "from" prices)
  - the pet-fee notice and checkout estimate
  - per-home check-in/out time fields (meta box + `[acs_checkin_times]` + email tags)
  - clearer booking messages, GA4 events and schema
  - the city search, moved out of MotoPress. The old copy in `motopress-hotel-booking/plugin.php` is a hand edit that acs-site unhooks. Don't touch it.
  - the weekly/monthly discount display at checkout
  - Book Now on dated search results posting straight to checkout
- Already fixed on production:
  - the FAQ Wi-Fi/kitchen duplicate
  - pet-policy placeholders
  - the refund-policy bracketed date
  - "active duty" removed from About
  - Fairbanks capacity set to 4 adults
  - global check-in 4 PM / check-out 11 AM
  - WELCOMEBACK 5% coupon, with coupons enabled
- Audit claims about these may be stale. Verify, and mark them NOT REPRODUCED where they're fixed.

## Operating rules
- Work sequentially. No subagents or parallel agents. Keep cost down.
- All output goes in ./acs-fix/. Update ./acs-fix/STATE.md after every step (done / in progress / next / blockers) so the run can resume cold. If context or budget runs low, stop at the nearest clean point and write the handover in STATE.md first. Never let work go backwards.
- Remote commands: `ssh -F ./ssh_config acs-staging '<cmd>'` and `ssh -F ./ssh_config acs-prod '<cmd>'`. The connections are already open. If ssh ever asks for a password or can't connect, stop work on that target, note it in STATE.md, and continue with anything that doesn't need it.
- Before every write, confirm the target with `wp option get siteurl`. Staging and production must never be confused.
- Before the first write on each target: `wp db export`, and pull the file to ./acs-fix/backups/<timestamp>-<target>.sql.
- Every change gets a ./acs-fix/CHANGELOG.md entry: what, where (post ID / meta key / file path), before, after, and the exact command that reverses it. Rollback means reversing that one change. Never run `wp db import` on production — it would erase bookings and form entries made since the backup. The backups are for Andrew only.
- Every search-replace runs with --dry-run first. Review each match in context. Restrict to specific post IDs and columns. Check `_elementor_data` postmeta (JSON), post_content, and MotoPress accommodation types (post type mphb_room_type).
- **All custom code goes in the existing site plugin** `wp-content/plugins/acs-site/` (edit the copy in ~/aurora-and-cedar, bump the version, keep one feature switch per new section in `acs_config()`), deployed by copying its files to the target with scp/rsync (no `--delete`). Use MotoPress hooks/filters; never edit other plugins' or theme files. Commit the plugin changes to the repo.
- After content or template changes: `wp elementor flush-css`, `wp cache flush`, and flush the GoDaddy page cache (discover the CLI command; if there isn't one, use the admin-bar "Flush Cache" link via Playwright on an already-logged-in session, or note it for Andrew). Then re-check the public page with `?cb=<timestamp>`.
- Never use GoDaddy's "push staging to live" — it overwrites the live database. Production gets changes by re-running the same scripts.

## Never
- Click the final checkout Book Now / Reserve, enter payment data, accept terms, or create a reservation — on staging or production (staging may carry live Stripe keys). Loading checkout pages to read quotes is fine.
- Submit any form, on staging or production.
- Invent numbers, names, or facts.
- Change Stripe keys, mode, or gateways; rates, prices, seasons, or discounts; pet or other fees and services (including the MPHB Pet Fee plugin settings); cancellation or deposit settings; tax settings; coupons.
- Install, update, deactivate, or delete WordPress core, themes, or plugins — **except updating the site's own acs-site plugin by copying its files**. Delete posts, pages, media, users, or bookings. Change user accounts or passwords.
- Change the phone field on either form.
- Publish anything that appears in DECISIONS.md.
- Touch OTA or channel listings (Airbnb, Vrbo, Booking.com, Furnished Finder, Google).

## Owner ground truth (use it; don't contradict it)
- 11 listed units across Puyallup, Tacoma/Parkland (129th St S), DuPont (4BR house, 408 DuPont Ave, 98327 — stays listed), and Fairbanks ("Cozy Aurora Retreat" = 10½ Rosella, 1BR/1BA). A 12th unit, 10 Rosella, will be added later — not in this run.
- **Fairbanks address and map: use 10 Rosella Ave, Fairbanks, AK 99701 for both 10 and 10½** (10½ doesn't resolve on Google Maps). Both units share the same map pin. Don't flag this as an error.
- Capacity: Cozy Aurora Retreat max 4 guests. DuPont 4BR max 10 guests. All other units keep their current values (listed in DECISIONS.md for review).
- Check-in 4 PM / check-out 11 AM at every unit, except DuPont: check-in 5 PM / check-out 10 AM.
- Business phone +1 (205) 341-7045 is correct. Contact emails: Hello@, Andrew@, Vivian@AuroraAndCedarStays.com.
- Phone stays required on both the Contact and Monthly forms.
- **Pet fees (current; already live — keep them):** $20 per pet, per night. Stays of 28+ nights: $399 for the first pet plus $100 for each additional pet. Service animals are never charged. The pet fee is collected separately after booking. Don't change any fee configuration, and don't replace this wording.
- **Stays of 28+ nights are bookable online, all the way through checkout**, with the monthly discount shown (acs-site already shows it). Guests can book and pay to lock in their dates and rate. The booking is subject to screening (credit check, background check, prior-landlord references; security deposit and first month due at signing), and the hosts reply within 24 hours. **If the hosts can't approve the stay, the guest gets a full refund** (approved by Andrew). Don't cap or block 28+ night stays.
- Month-to-month: every stay is individually quoted. Extensions are possible but not guaranteed unless booked up front.
- Sami, the former developer, no longer works on the site.
- Andrew separates from active duty on Dec 17, 2026, so "active-duty" wording will go stale.
- Andrew's home Wi-Fi blocks this domain with a content filter. A page reading "Access to this website is blocked", or a TLS failure while other sites load, means the network is blocked — not that the site is down.

## Phase 0 — Logins and preflight (Andrew is here)
1. Reachability: request the domain over http and https. If blocked, tell Andrew to connect his VPN, wait for him, and re-check.
2. Tools: confirm `node -v` and `npm -v` work. If not, stop and tell Andrew to install Node.js (nodejs.org, LTS), then re-check.
3. SSH: on each target run `echo ok`, locate the WordPress root (wp-config.php), then `wp option get siteurl` and `wp --info`. Stop and tell Andrew if staging's siteurl equals production's. Save WP paths and URLs to ./acs-fix/targets.env.
   - Staging should be **GoDaddy's own staging site** (Settings → Staging Site → Create). The old WPvivid copy at `/mystaging01` is stale and hand-modified, so don't use it.
   - If staging turns out to be `/mystaging01` on the production host, stop and tell Andrew.
4. Staging freshness: compare the latest modified dates of posts, pages, and mphb_room_type on both targets. If staging is behind production, ask Andrew to run GoDaddy's copy-live-to-staging (the direction that only overwrites staging), wait, and re-check. Confirm acs-site 0.2.0 is active on staging too.
5. Install Playwright with Chromium (`npx playwright install chromium`) and confirm it loads staging and production.
6. Print: "All logins verified. You can walk away." From here on, no questions.

## Phase 1 — Inventory and verify (read-only, both targets)
./acs-fix/INVENTORY.md: WP and PHP versions, active theme, plugins with versions and available updates (report only), users and roles (flag Sami's account and the author slug exposing his Gmail address), MotoPress page assignments and booking rules, SEO plugin present or not, cache layer, existing mu-plugins, acs-site version and its feature switches.

./acs-fix/VERIFY.md: for each audit claim record CONFIRMED / NOT REPRODUCED / PARTLY / CAN'T TEST with evidence (URL, selector, screenshot path, DB location) and root cause. Put a re-ranked "what is actually broken" list at the top.

Reproduce booking behavior like a human: click datepicker cells; never type into inputs or set values with JS (the audit's "hidden date fields stay empty" may be an automation artifact).
- B1 Homepage search, Nov 2–5 2026, 1 guest → result → Book Now. Expected (acs-site 0.2.0): Book Now posts straight to checkout with dates, guests and price, and "View details" keeps the dates. Verify; don't rebuild.
- B2 Fairbanks property widget, Nov 2–5 → "An error has occurred". Capture the admin-ajax request/response and console errors. Test whether cached HTML serves an expired nonce: check cache headers (acs-site sends `X-ACS-Cache: bypass` on booking pages); compare cache-bypassed and cached loads.
- B3 30-guest search still returns Fairbanks. Read each unit's capacity settings (discover the meta keys) and how the search guest field maps to MotoPress adults/children.
- B4 Past dates selectable; one-night search returns "Nothing found" — minimum-stay rule? (Known min stays: Fairbanks 3, DuPont 4, others 5–10.)
- B5 Checkout for an available range: record line items and total, stop before entering anything. Check the Stripe publishable key prefix (pk_live vs pk_test) — report only.
- B6 Double-booking protection: iCal import URLs per unit (Airbnb / Vrbo / Booking.com) and whether sync is running on production (last run, cron). If missing, flag as the top operational risk.
- B7 How MotoPress handles stays of 28+ nights today (checkout accepts them; the monthly discount shows; tax applied?).

Also verify: where each displayed price comes from (Fairbanks and DuPont both show $410/night — check for a shared default); tax configuration (the audit's checkout taxed $445 room at 8% and not the $90 cleaning fee); "light rail" on Puyallup pages; ZIP 98344 vs 98444 for 324 129th St S; "Hightlights" typo; "Essentials" shown as not included; bracketed policy dates on the remaining policy pages; capacity and check-in/out copy against ground truth; "active-duty" wording anywhere else; sitemap contents and indexable system/author/archive pages; meta descriptions; H1s; the element causing horizontal overflow at 768px; gallery dot/arrow sizes; icon-only links without names; footer "#" anchors; SPF/DMARC (and DKIM if a selector is discoverable) and how WordPress sends mail.

## Phase 2 — Build on staging
After each item: verify on staging, save before/after screenshots, add a CHANGELOG entry, update STATE.

Content and structure
- F1 "light rail" → Sounder commuter rail, worded to fit each sentence (e.g. "Puyallup Sounder commuter-rail station"). No travel times you can't verify.
- F2 ZIP 98344 → 98444, only in strings containing "129th".
- F3 "Hightlights" → "Highlights".
- F4 Remove the brackets around policy effective dates, keeping the date text.
- F5 In acs-site: noindex (wp_robots) and removal from the core sitemap for MotoPress search results / checkout / confirmation / status / cancellation / account pages, author archives, amenity and city taxonomy archives, and redirect-alias URLs; author archives 301 to the home page. Extend acs-site section 10b rather than duplicating it. If an SEO plugin is active, use its settings instead.
- F6 Accessibility and layout CSS (loaded from acs-site): fix the 768px overflow at its source element; gallery dots and arrows at least a 44×44 hit area with visible focus; accessible names for icon-only links (social icons, logo); footer "#" anchors become plain text or real links.
- F7 Property single template: the property title is the one H1. Check at 390, 768, and 1366.
- F8 Booking handoff: already done in acs-site. Only fix a problem Phase 1 actually reproduced (e.g. B2's nonce error), and only with template, CSS, or cache-exclusion changes; otherwise document the options in DECISIONS.md.
- F9 Static prices on Home and Listings cards (and anywhere else a price appears outside the booking engine): replace hard-coded "$X/Night" with acs-site's `[acs_from_price type="<room type ID>"]`, which reads the live MotoPress rate. Where a shortcode can't render, use "See rates for your dates". Don't touch MotoPress-calculated prices.
- F10 Capacity: set Cozy Aurora Retreat to max 4 total guests and DuPont to max 10 in MotoPress (discover how adults/children/total are stored; no search or checkout may exceed the max). Make the search guest field enforce capacity. Correct on-page copy (e.g. "up to five" → four for Fairbanks; any DuPont count other than 10).
- F11 Check-in/out: global MotoPress times stay 4 PM / 11 AM. Set DuPont to 5 PM / 10 AM with acs-site's per-home fields (the "Check-in / check-out (this home)" meta box on its Accommodation Type), and make property copy, FAQs and policies match. Check that the email tags `%acs_check_in_time%` / `%acs_check_out_time%` render; if they don't, note it and leave the email templates as they are.
- F12 Meta descriptions (155 characters or fewer) for Home, Listings, Monthly, Contact, FAQ, About, and the 11 property pages, using only facts already on each page (drafts are in ~/aurora-and-cedar/copy/10-seo.md). Use SEO plugin fields if present, otherwise acs-site. Log each in the CHANGELOG.

Stays of 28+ nights (bookable online — see ground truth)
- M1 In acs-site, for checkouts of 28+ nights, show a clear notice above the price breakdown and near the final button. Draft text (Andrew can edit):
  > **Staying 28 nights or more? Talk to us before you book.** Longer stays need a quick screening: a credit and background check and a reference from a prior landlord, depending on your location. You can book now to lock in these dates and this rate. We'll contact you within 24 hours to finish screening. If we can't approve your stay, you'll get a full refund. Security deposit and first month are due at signing.

  Include a **"Message us about this stay"** link (mailto:Hello@AuroraAndCedarStays.com, with the subject and body prefilled: property, dates, guests, total). Make it survive MotoPress's AJAX re-renders, the same way the acs-site discount display does. Display only: no change to price, payment, or whether checkout can complete. Nothing under 28 nights changes.
- M1b Refund policy page (/refund-cancellation-policy/, page 2012): add one line under the refund schedule. This is **approved**, so publish it on production together with M1:
  > Stays of 28 nights or more are subject to screening. If we can't approve your stay, you'll get a full refund.
- M2 Put a short version of the same notice (one line plus the message link) on search-result cards and the property booking widget when the selected stay is 28+ nights.
- M3 Monthly page: if the form has no property field, add an optional "Property" dropdown of the 11 units (phone field untouched).
- M4 Report whether tax is charged on 28+ night stays. Washington and Fairbanks may exempt stays of 30+ days — report only, change nothing.

## Phase 3 — Test on staging
./acs-fix/TESTS.md, pass/fail per case at 390, 768, and 1366:
- Each F and M item's own check.
- 1-, 3-, 7-, 27-, 28- and 30-night stays reach checkout with correct dates, guests, and total (stop before entering anything). Totals must match a quote taken before your changes, to the cent (baseline table in HANDOVER.md).
- 28+ night checkouts show the M1 notice and message link, which survive a guest-count change and a coupon; under 28 nights shows no notice.
- Capacity: 5 guests is refused for Fairbanks, 11 for DuPont; valid counts pass.
- Past dates can't be selected.
- Every public page still loads; noindex and sitemap are as intended; no horizontal scroll at 768; no new console errors.
An item passes only if all its cases pass. Fix and re-test failures; after two failed attempts on one item, stop on it, document it in DECISIONS.md, and leave it off the promotion list.

## Phase 4 — Go live
Only after Phase 3 is complete.
1. `wp db export` on production → pull to ./acs-fix/backups/.
2. Apply every passed item to production with the same scripts, in the same order. Failed or unfinished items stay off (acs-site feature switch false).
3. Flush caches and re-run the Phase 3 tests on production (still never completing a booking or submitting a form).
4. If an item fails on production, reverse just that item with its CHANGELOG command and note it.
5. Commit the repo changes. Update STATE.md with the final state.

## Phase 5 — DECISIONS.md (drafts only; not published)
One section per item: current text (quoted), proposed text, reason, and an "[ ] Approve  [ ] Edit" line. Write "CONFIRM:" wherever a fact is unknown.
- D2 FAQ Wi-Fi/kitchen answer: confirm every unit, including the basement studio, has a full kitchen.
- D3 Capacity table for the other 9 units (current values, conflicts flagged).
- D4 Monthly page copy: what's included, screening, deposit and first month, extension policy, 24-hour response, Puyallup in the location list.
- D5 About page military bio, accurate before and after Dec 17, 2026.
- D6 Anything else Phase 1 surfaced, plus any item that failed promotion, with options.

## Out of scope (list in the report; don't start)
GA4 / Ads / Meta tracking, cookie consent, Google Vacation Rentals, new landing pages, image alt text (done), performance and plugin cleanup, header unification in Elementor Theme Builder (give click-path instructions only), cross-streets / hiding exact addresses (draft in copy/06-cross-streets.md, waiting on Andrew).

## Finish → ./acs-fix/REPORT.md (one page)
What is live now; what stayed on staging and why; confirmed vs not-reproduced audit claims; what's waiting on Andrew (point to DECISIONS.md); recommended account security steps (remove Sami's WordPress account and author archive, reset admin passwords, review GoDaddy account access he held); the next three actions. Plain language, no process chatter.
