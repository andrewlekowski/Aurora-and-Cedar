# auroraandcedarstays.com fix log

## 2026-09-29: cloud session (no live changes)
**Nothing was changed on the live site.** This session ran in a cloud container that has no Claude in Chrome, and its network policy blocks auroraandcedarstays.com (proxy 403). None of the wp-admin steps could run.

To keep the next session moving, everything that could be done offline is drafted here and ready to paste:

| Handover step | Status | File |
|---|---|---|
| 1. Fairbanks 1722 host/dog removal | Exact edits + console snippet written. **Not applied.** | `copy/01-fairbanks-1722.md` |
| 2. Home page 23 | Typos, headings, 3 real testimonials. **Not applied.** Card prices still need checking against MPHB. | `copy/02-home-23.md` |
| 3. Review count shortcode | mu-plugin written (`[acs_review_count]`, option `acs_review_count`, default 765). **Not uploaded.** Weekly Chrome task not created, because it needs a local Chrome session. | `mu-plugins/acs-review-count.php` |
| 4. About page | Copy rewritten. Photo not uploaded (file not provided). Vrbo status unconfirmed. | `copy/04-about.md` |
| 5. FAQ | Fixed Wi-Fi/kitchen answer, check-in/out answer, 7 new answers | `copy/05-faq.md` |
| 6–7. Pet + Refund policies | Replacement text. Pet species/limits/units left as placeholders. | `copy/06-07-policies.md` |
| 8. Cleanup | Not done (needs wp-admin) | — |
| 9. Monthly & Extended Stays | Page copy + MetForm field list | `copy/09-monthly-stays.md` |
| 10. Verify & report | Not done | — |
| MPHB settings: date format mm/dd/yyyy, check-in 4 PM / out 11 AM | Not done | — |

### Before applying
- Take a fresh WPvivid backup (the last one is from Sep 28, 4 PM AKDT).
- To install the mu-plugin: upload `acs-review-count.php` to `wp-content/mu-plugins/` via GoDaddy File Manager/SFTP, or paste its body into a Code Snippets snippet set to run everywhere.

### Andrew's answers (Sep 29)
- Airbnb: **do not lengthen the availability window and do not touch Airbnb at all.** The Jan 25 – Sep 30, 2027 Fairbanks block stays as is.
- Vrbo Premier Host: still current. The About copy keeps it.
- Pets: friendly pets allowed; guests ask the host about restrictions. The pet policy copy is updated to match.
- Family photo: received in chat and saved as `assets/VivianSalchaRiver-6-2.webp`.

### Still open
- Nothing. As of Sep 29 Andrew approved the pet house rules and the base names (JBLM / Fort Wainwright / Eielson), and set WELCOMEBACK at 5%.

## 2026-09-29 (evening): phase 1 applied live (local Chrome session)
Andrew signed in himself. **Fresh WPvivid backup first:** Database + Files, local, marked "only delete manually". It finished at 01:13 server time on Sep 29 (Succeeded).

| Step | Result |
|---|---|
| 1. Fairbanks 1722 | Already live before this session. Verified logged-out: "up to 4 guests"; no Daniel, host-lives-downstairs or on-site-dog text. Room type 1857 has 4 adults and a clean description. `/rosella-guide/` is clean and loads logged-out. |
| 2. Home 23 | **Live.** Typos fixed. Headlines are "Book Direct and **Save**" and "Everything You Need for a **Comfortable Stay**". The kitchen blurb is replaced. The 3 real testimonials (Safdar, Hannah, Daniel) are in, with no photos. The button reads "See all 765 reviews on Airbnb" and links to the profile. It's hard-coded because button text doesn't run shortcodes. Card prices $360 / $130 / $155 match MPHB rates 1893 / 1865 / 1866. |
| 4. About 51 | **Live.** New hero and story. Andrew is described as an "Army aviation veteran and former Apache pilot"; the old "active duty" line is gone. The page has the care / who-stays / Superhosts sections and the new Mission, Vision and CTA. The fluff animated headline was removed. The mattress photo (media 622) has its caption. The family photo was uploaded as media 2889, with alt text and caption, and placed at the top of the story. |
| 5. FAQ 102 | **Live.** Wi-Fi/kitchen and check-in answers fixed. The long-stay answer now links to the Monthly page. 6 new Q&As added and everything renumbered 1–16. |
| 6. Pet policy 2124 | **Live.** Replacement text; no placeholders or building language. |
| 6b. Pet Fee plugin message | The link already pointed to `/pet-policy/`. The text said "$399 per pet"; it now says $399 for the first pet + $100 for each additional pet. |
| 7. Refund policy 2012 | **Not changed. Waiting on Andrew.** The tiers already match. The draft would drop 3 current notes (processing fees may be non-refundable, travel insurance recommended, refund goes to the original payment method) and set the effective date. |
| 8. Cleanup | **Not done.** Trashing Hello World post 1, Sample Page 2 and comment 1 was blocked by the session's permission check. Andrew to do it in wp-admin. |
| 9. Monthly & Extended Stays | **Draft, page 2899**, `/month-to-month-furnished-rentals/`. Built with the **Elementor Pro Form** widget, the same as Contact: 10 fields, email to Hello@ plus save to DB. It doesn't use MetForm because MetForm has no forms and keeps redirecting to its onboarding wizard (diagnostic sharing was unticked; the wizard was skipped). Not in the nav or footer yet. The FAQ already links to it, so that link 404s until the page is published. |
| MPHB settings | **Saved.** Date format mm/dd/yyyy, check-in 16:00, check-out 11:00. |
| 10. Verify | Home, About, FAQ and Pet Policy were checked logged-out after saving (cache-busted fetch). |

Listing page IDs (for `acs_config()['listing_page_ids']`): 1722, 1560, 1536, 1503, 1481, 1449, 1424, 1365, 1325, 1265, 1077.

**Follow-up (same evening, after Andrew's answers):**
- **Refund policy:** live. Draft tiers, effective **September 28, 2026** (Alaska date). Andrew's 3 notes are kept, plus the 4th original note ("Refunds are calculated based on the official check-in date and time").
- **Monthly & Extended Stays (2899):** published. "Monthly Stays" added to the Header menu after Listings and to the footer link list (template 1592) after Listings.
- **Cleanup:** Hello World post 1, Sample Page 2 and comment 1 moved to **Trash** (restorable).
- **Staging:** WPvivid staging created at `/mystaging01` (prefix `wpvividstg01_`, same DB), 02:33–02:41 server time. **Every PHP request on it returns HTTP 500 with an empty body.** Static files serve. Needs the PHP error log (GoDaddy File Manager/SFTP). Likely suspects: the GoDaddy system mu-plugin, an `object-cache.php` drop-in, or hard-coded values in the staging `wp-config.php`. **acs-site not installed on staging or live.**
- `listing_page_ids` in `acs-site.php` now lists all 11 IDs. `acs-site.zip` was rebuilt.
- PageSpeed "before" baseline: not captured. The PSI API returned 429 without a key, and pagespeed.web.dev stayed on "loading".

**Phase 2 #6, #10 and #12 (same evening):**
- **#12 WELCOMEBACK:** live as MPHB coupon 2926: 5%, all 11 accommodation types, min 1 night, no expiry, no usage limit. MPHB's "Enable the use of coupons" was **off**; it's now on and saved (date and time settings re-checked, unchanged). End-to-end checkout test not done. Also found an existing **draft** coupon DISCOUNT2027 (from Aug 24, marked as locked by another user); left untouched.
- **#10:** no SEO plugin is installed. 95 of the 96 images shown on the site had no alt text, and all 95 now have alt text written from the photos. Elementor and GoDaddy caches cleared; verified live. Plugin choice, plus titles and meta descriptions ready to paste: `copy/10-seo.md` (plugin to go through staging).
- **#6:** draft only, `copy/06-cross-streets.md`. All 11 listing pages currently show full street addresses (with unit numbers) and exact-pin maps. Cross streets were checked on Google Maps. Listing 1265 shows ZIP 98344 (should be 98444).
- **Staging fix:** the 500 error is most likely caused by the GoDaddy-only `wp-content/object-cache.php` drop-in and `mu-plugins/gd-system-plugin.php` that were copied into `/mystaging01/`. Renaming them needs File Manager/SFTP, and GoDaddy's host panel asks for Andrew's password. **Blocked until Andrew signs in.**

**Staging fixed (GoDaddy File Manager, Andrew signed in):**
- **Cause, from GoDaddy Site Logs:** the staging `wp-config.php` line 29 requires `__DIR__.'/../configs/wp-config-hosting.php'`, which doesn't exist one folder down → PHP fatal. That hosting config also supplies the DB credentials and core settings. WPvivid's `$table_prefix = 'wpvividstg01_'` line was **commented out**, so a naive path fix would have pointed staging at the live tables.
- **Changes, all inside `/mystaging01/` only:**
  - `wp-config.php`: added an isolation block **before** the hosting require (ABSPATH, WP_HOME/SITEURL `/mystaging01`, WP_CONTENT/PLUGIN/MU dirs and URLs, `WP_CACHE false`, `DISABLE_WP_CRON true`, `WP_ENVIRONMENT_TYPE staging`). Path changed to `/../../configs/`. `$table_prefix = 'wpvividstg01_';` uncommented.
  - Renamed to `*.staging-disabled`: `wp-content/object-cache.php`, `mu-plugins/gd-system-plugin.php`, `mu-plugins/object-cache-pro.php`.
- **Verified:** staging home, login, a listing page and FAQ return 200, and assets load from `/mystaging01/`. Media 1244 alt text is **empty on staging and new on live**, so staging reads its own tables. Live home and login are unchanged (200).
- Staging login is separate (its own cookie). WP-Cron is off on staging (no iCal sync or emails).
- If staging is ever recreated, redo these edits. WPvivid will overwrite them.

**Phase 2 (original note):** Opening WPvivid → Staging was blocked by the session's permission check, so `acs-site` is **not installed anywhere**. Per the staging-first rule, it did not go on live either. `acs-site.zip` is built in the repo root.

## 2026-09-29: phase 2 (cloud session, no live changes)
Still no Chrome and still blocked by the network policy (site, Airbnb, wordpress.org). Built the `acs-site` plugin (staging-first, see its README) and the monthly health-check prompt. Wrote `phase-2-report.md`.
Andrew (Sep 29): he's an **Army aviation veteran, former Apache pilot**, not active duty. The About draft is updated.

## 2026-09-29 (night): stopped mid checkout task
See `HANDOVER.md`. Staging fixed and working (plain permalinks). acs-site v0.2.0 (city search moved out of MotoPress, discount display, results→checkout) is on staging: 30/30 quotes match the baseline. Nothing from this task is on live.

## 2026-09-28 9:30-10 PM AKDT: checkout task staging tests
acs-site v0.2.0 with the &plus;/colour fixes is on staging. Discount display: 30/30 totals match to the cent; coupon + weekly verified (MPHB total $962.61, savings $137.03). Book Now: 30/30 land on checkout with the right home, dates and guests and the baseline totals; Back works; the forced min-stay failure redirects with the message. Not tested: mobile width, logged-out, email. Waiting for Andrew's OK to push to live. Details are in HANDOVER.md.

## 2026-09-28 ~10:45 PM AKDT: checkout discount + Book Now LIVE
Andrew approved. WPvivid backup Sep 29 05:40 server time → acs-site v0.2.0 uploaded + activated on live → GoDaddy cache flushed. Logged-out checks pass. 11/11 live totals unchanged to the cent. WELCOMEBACK + weekly verified on live ($962.61, savings $137.03). Rollback: deactivate ACS Site Customizations (the old MotoPress city search comes back automatically) or restore the 05:40 backup.

## 2026-09-28 (late): Andrew's decisions for the fix run
- **Pet fees stay as live:** $20 per pet per night; 28+ nights $399 first pet + $100 each additional.
- **Fairbanks:** 10 Rosella Ave is the address and map pin for both 10 and 10½ (10½ doesn't resolve on Google Maps).
- **28+ night stays:** stay bookable through checkout with the discount shown. Guests can pay to lock in dates and rate. A notice + "Message us" link says screening applies and hosts reply within 24 h. **Approved:** full refund if the stay isn't approved. Refund-policy line to be added with the notice.
- Revised run prompt and setup script: `tasks/acs-fix-run-prompt.md`, `tasks/acs-fix-run-setup.sh` (uses GoDaddy's own staging, not /mystaging01; extends acs-site instead of a new mu-plugin; needs Node.js installed).
- **LIVE: acs-site 0.2.1, the 28+ night notice** (section 18; switch `long_stay_notice`, threshold `long_stay_nights`).
  - Checkout for stays of 28+ nights shows the screening notice above the price breakdown, plus a short line above the final button. Both have a "Message us about this stay" mailto to Hello@, prefilled with property, dates, nights, and the current guests/total. Search cards show a long-stay line with the same link.
  - Staging: 30n shows it, 7n/5n don't, totals unchanged, it survives a guest change, and the email fills "Guests: 3 / Total shown: $3,571.92".
  - Live: WPvivid DB backup at **06:43** server time → upload 0.2.1 → cache flush. Logged out, all 11 totals are unchanged; the notice shows on exactly the four 30-night cases; search results for 30n show the line on 10/10 cards.
  - Screenshot: `screenshots/after-30-night-long-stay-notice.jpg`.
- **LIVE: refund policy (page 2012)** has a new line after the schedule: "Stays of 28 nights or more are subject to screening (credit and background check and a prior-landlord reference). If we can't approve your stay, you'll get a full refund."
- Rollback: set `long_stay_notice` to false, or re-upload acs-site 0.2.0 from git. The refund line is in Elementor revisions.

## 2026-09-29 (early, server 07:15+): "fix all issues" from acs-fix/LIVE-CHECK.md
WPvivid DB backup on live at **07:15** server time before starting. All edits below are on **live**, made in Elementor (revisions kept) unless noted.
- **ZIP 98344 → 98444:** Home (address line), Listings (address line), NEW 2/1 (1265) address line + Google Map widget address.
- **"Puyallup light rail station" → "Puyallup Sounder commuter-rail station":** 1536, 1481, 1449, 1424, 1365 (1365 re-checked: 0 "light rail" left).
- **"Hightlights" → "Highlights":** Fairbanks 1722 (now "Location Top Highlights").
- **Policy dates:** removed the brackets from "[June 9, 2026]" on Privacy (3), Cookie (2006), Terms (2008), Accessibility (2010).
- **H1:** the top title heading on all 11 listing pages changed h2 → h1. Each has an explicit 40px font size, so nothing changes visually.
- **DuPont (room type 1855):** MPHB capacity was already 10 adults (no change). Per-home times set to **5:00 PM / 10:00 AM** (acs-site meta box). The FAQ now says the home "sleeps up to 10 guests".
- **Card prices (F9):** the 11 Listings price headings and 3 Home price headings now use `[acs_from_price type="…" format="number"]`. Staging test first: all 11 rendered prices equal the old hard-coded ones ($360, $130, $155, $155, $120, $125, $125, $310, $620, $260, $125), so the audit's "$410" wasn't reproduced and nothing a guest sees changed. Home is CDN-cached, so its cards update after a cache flush.
- **acs-site 0.2.2 (code done in git, NOT yet on live):** search drops homes smaller than the party (adults + children vs total capacity, or adults + children capacity when total is blank). Section 19 adds meta descriptions for 17 pages, a 301 from author archives to home, noindex on amenity/city archives, my-account and booking-cancellation, and removes users, amenity and city from the core sitemap and the logged-out REST users list. **On staging and verified:** 30 guests → only 1853 (4 Apts) and 1891 (Duplex), because both are set to **30 adults** in MPHB (Andrew: is that right?). 5+ guests hides Fairbanks. The author archive 301s home, city archives are noindex, and meta descriptions print. Pushing to live through the plugin editor was blocked by Claude Code's auto-mode permission check, so **Andrew must approve it or upload it**.
- **Still to do:** verify/finish 0.2.2 on staging → live; F6 (768px footer overflow, gallery tap targets, icon-link labels, footer `#` links); report-only checks (B2, B4, B5, B7, SPF/DMARC, Vrbo/Booking feeds); cache flush + logged-out verification.
- **SPF/DMARC (read-only):** SPF `v=spf1 include:spf.protection.outlook.com include:secureserver.net -all`; DMARC `p=quarantine` with rua reports. Both fine.
- **LIVE: acs-site 0.2.2** (Andrew approved). Deployed via the plugin editor on top of the 07:15 DB backup (file rollback: re-save 0.2.1 from git). GoDaddy cache flushed. Logged-out checks:
  - Search, Nov 10–17: 30 guests → none, 24 → 4 Apts only, 15 → 4 Apts + Duplex, 5 → 7 homes (no Fairbanks), 2 → 8.
  - `/author/ch-samikamboh22gmail-com/` → 301 to home.
  - `wp-sitemap.xml` lists only pages and accommodation types.
  - `/wp-json/wp/v2/users` → 404 logged out.
  - Meta descriptions present on Home, Listings, About, FAQ, Contact, Monthly (`/month-to-month-furnished-rentals/`) and the listings checked; one H1 on each. Home shows 98444 and prices $360/$130/$155 from the shortcode.
- **MPHB capacity (Andrew's numbers):** 4 Apts (1853) 30 → **24** adults; Entire Duplex (1891) 30 → **15** adults.
- **LIVE: footer template (1592, Elementor):** the logo links to home and the copyright line no longer links to `#`. Footer CSS lets the contact list wrap (the phone number overflowed at 768px). Gallery controls: arrows are now 44×44, dots 12px with 12px spacing, and both show a focus ring. Checked in a 768px frame: no horizontal overflow and no `#` links left. Icon-only links: none without a label were found on Home or Fairbanks (gallery buttons already have "Previous/Next slide", "Go to slide N").
- **Read-only checks:**
  - B4: past dates are rejected ("Check-in date cannot be earlier than today").
  - B7: accommodation tax covers all 11 homes (Fairbanks 8%, Tacoma 12.3%, Puyallup 12.2%, DuPont 16.6%, all "included"). Cleaning fees are per home.
  - Feeds: the Sync Calendars page has 11 Airbnb, 8 Vrbo and 8 Booking.com import URLs. The 3 without Vrbo/Booking match the earlier spot-check: Duplex, 2 Apts, 4 Apts.
  - B5 (Stripe live vs test key): **not checked**. Reading the payment settings page was blocked by Claude Code's permission check because it holds API keys; Andrew should look at MotoPress → Settings → Payment Gateways → Stripe (key starts `pk_live_`).
  - B2: the booking-widget error needs manual datepicker clicks; not re-tested (Book Now and checkout worked 30/30 earlier).
- GoDaddy cache flushed after the footer change.

## 2026-10-09 (night): "Why Aurora & Cedar?" page (why-aurora-and-cedar.zip v2, CLAUDE_CODE_PROMPT.md)
- Prompt and page bundle: `~/Downloads/why-aurora-and-cedar.zip`.
- **Plugin zip:** `~/Desktop/acs-site.zip` turned out to be **0.2.2** (the same as git and the live site). The real **0.2.3** is `~/Downloads/acs-site.zip`. Compared with 0.2.2 it only adds section 20 (enqueues `assets/acs-why.css` on the `why-aurora-and-cedar` page, plus its SEO title and meta description), the CSS file (byte-identical to `production/acs-why.css`) and a README row. That's the zip to upload.
- Started in Chrome: the wp-admin session had expired, so I'm waiting for Andrew to log in. Nothing has been changed on the site yet.
- **WPvivid backup (Database + Files, Local), live:** finished **Oct-10-2026 05:14** server time, id `wpvivid-69f8e3c03370a` (type Manual).
- **Media Library, live:** uploaded the 17 `why-ac-*.jpg` with the filenames unchanged (none existed before, so there are no `-1` duplicates; `mockup-logo.png` was not uploaded). URLs are `/wp-content/uploads/2026/10/<filename>`, attachment IDs about 3054–3070. Alt text and captions come from `image-manifest.csv` and were checked by re-reading all 17. The hero and the then/now split get no caption: the manifest marks them "(no caption)", and the split's labels are in the page HTML.
- **LIVE: acs-site 0.2.3**, installed via Plugins → Add New → Upload → "Replace current with uploaded" (the screen showed current 0.2.2 → uploaded 0.2.3), on top of the 05:14 backup. Afterwards: the plugin is active and reports 0.2.3, `assets/acs-why.css` returns 200, and Home loads logged out with no fatal error. Rollback: re-upload 0.2.2 from git (`~/Desktop/acs-site.zip` is a copy of 0.2.2).
- **Draft page created: "Why Aurora & Cedar?" (ID 3072)**, slug `why-aurora-and-cedar`, parent About (51), template Elementor Full Width (`elementor_header_footer`), Hide Title on. Its Elementor content is one full-width container (padding, margin and gap all 0) holding one HTML widget with `production/why-aurora-and-cedar.page.html`. All 17 `{{MEDIA:…}}` placeholders, including the hero's `background-image`, are replaced with the uploaded URLs (all return 200). The saved HTML is the same length as the source (14,271 chars), and no copy was changed. Saved as **Draft** (not published). No SEO plugin is active; the 0.2.3 section 20 supplies the title and meta description.
- **Draft check (step 4)** at 860px (the real window), and at 1366px and 400px in fixed-width frames, logged in as preview:
  - **Passed:**
    - Fonts are Playfair Display and Inter, both loaded, no fallback.
    - Exactly one H1.
    - 16 `<img>` plus the hero background all load.
    - The breadcrumb's "About" link goes to `/about/`, and both buttons go to `/rental-unit-in-fairbanks/`.
    - No sideways scroll at 400px.
    - `acs-why-css` loads, and the title and meta description print.
    - The antler rings sit on the antlers in both photos at both widths (the images aren't cropped).
    - The Then / Now labels sit at the bottom of the split image.
  - **Doesn't match the mockup:**
    1. The site's global link style (Elementor kit 19, `.elementor-kit-19 a`) sets every link to 20px with -0.6px letter spacing. So the hero breadcrumb's "About" shows 20px/400 instead of 13px/500 uppercase with .1em letter spacing, and the footer email link shows 20px instead of 14px. The buttons aren't affected (17px, as designed). A fix would be one CSS line in `acs-why.css`, e.g. `.acs-why .crumbs a,.acs-why a.mail{font:inherit;letter-spacing:inherit}`. **Not done:** waiting for Andrew's OK (it's a plugin change).
    2. At 400px the "Now · 10 Rosella Ave" label covers the end of "Then · The cabin off Farmers Loop". The mockup's CSS is identical, so the approved design does this too. Not changed.
  - Also seen at 400px: a 20px gap between the header and the hero. About has the same gap, so it's the site header, not this page.
  - Screenshots: `screenshots/why-ac-draft-{1366-hero-intro,1366-antler-rings,1366-then-now,400-hero,400-antler-rings,400-then-now-overlap}.jpg`.
- **Stopped at step 4 for Andrew's approval.** The page is still a Draft, the About page is untouched, and the cache has not been flushed.

## 2026-10-09/10: Andrew approved (buttons OK, antler set correct, Valdir OK, address OK) → step 5
- **LIVE: page 3072 published** in Elementor at `/about/why-aurora-and-cedar/` (parent About, Full Width template). The link-size CSS fix was **not** applied (no OK given).
- **LIVE: About (51)**, in Elementor (revision kept): added the `production/about-link.html` line, `<p class="acs-about-link"><a href="/about/why-aurora-and-cedar/">Why Aurora &amp; Cedar? Read the story behind our name &rarr;</a></p>`, as the last paragraph of "Our story" in text widget `dbf9700`, right before the "What we care about" heading. Checked in code that this line is the only change (the widget is +135 chars, all of it the new line). No new sections, images or styling; the link takes the site's own link style (sage, 20px).
- **GoDaddy cache flushed** (Quick Links → Flush Cache → "Cache cleared").
- **Logged-out check** (curl, `?cb=<timestamp>`, Cloudflare MISS, real site HTML rather than a filter page):
  - New page: 200, title "Why Aurora & Cedar? The Story Behind Our Name", meta description present, `acs-why-css` loaded, one H1, all 17 image URLs, no `{{MEDIA` placeholders left, the breadcrumb goes to `/about/`, both buttons go to `/rental-unit-in-fairbanks/`, not noindex.
  - About: 200, the link line appears once with the correct href.
  - Both plain URLs (no `cb`) also serve the new content. `/why-aurora-and-cedar/` 301s to `/about/why-aurora-and-cedar/`.
  - Caveat: this was run from Andrew's machine. The responses were real site HTML, but a check from an outside network (phone on cellular) is still worth doing.
- Screenshots: `screenshots/after-why-ac-live-1366.jpg`, `screenshots/after-about-why-ac-link.jpg`.
- **Still open:** (1) the global link style makes the hero breadcrumb "About" and the email link 20px instead of 13px/14px (one-line CSS fix in `acs-why.css`, needs Andrew's OK and a 0.2.4); (2) at 400px the Then/Now labels overlap (the mockup does the same); (3) acs-site 0.2.3 isn't in git yet, since the repo is still at 0.2.2.
- Rollback: unpublish page 3072; About → Elementor revisions; acs-site → re-upload 0.2.2; full rollback from WPvivid `wpvivid-69f8e3c03370a` (Oct-10-2026 05:14).

## 2026-10-10 (server 05:37+): accent-wall photo swap on "Why Aurora & Cedar?"
- Andrew asked to swap the intro accent-wall photo for `~/Downloads/IMG_8475.HEIC` and keep everything else the same. It's the same scene (wall, antlers, sign, bench, pillows, moose mugs), so the alt text and caption still fit.
- **WPvivid backup (Database + Files, Local)** first: **Oct-10-2026 05:37**, id `wpvivid-154b7fd97bf06`.
- Image: HEIC (3591×5027) → cropped to 3:4 from the top (only the bottom of the table is lost) → **1600×2133 JPEG**, the same size and ratio as the old file, quality 65, ~600 KB. **All camera metadata stripped**, including GPS, make/model and date (round-tripped through BMP).
- **Media Library:** `why-ac-accent-wall-v2.jpg` (ID 3083), with alt text and caption copied from `why-ac-accent-wall.jpg`. The old file is kept, not deleted.
- **LIVE: page 3072**, Elementor HTML widget: the only change is the intro `<img src>`, `why-ac-accent-wall.jpg` → `why-ac-accent-wall-v2.jpg` (checked: the swap is the only difference; width/height attributes, alt, caption and copy are unchanged). Saved as an update; the page stays published.
- GoDaddy cache flushed ("Cache cleared"). Logged out (curl, with and without `?cb=`): 200, v2 present once, old file referenced 0 times, all 17 image URLs; v2 returns 200. In the browser, the new photo renders 1600×2133 with the same caption.
- Screenshot: `screenshots/after-why-ac-accent-wall-v2.jpg`.
- Rollback: change the `src` back to `why-ac-accent-wall.jpg` in the HTML widget (or use Elementor revisions), then flush the cache.

## 2026-11-08: Rosella = 3 products (hidden drafts on LIVE, Andrew's choice) — NOT PUBLISHED
Restore point: WPvivid backup **Nov-08-2026 04:08** server time (268.94 MB, manual-delete only).
- **acs-site 0.3.0** installed on live (was 0.2.3). New file `includes/direct-booking.php`:
  pricing config (`acs_direct_config()`: DIRECT_DISCOUNT 0.10, Airbnb month tables, overrides, cleaning/pet fees,
  families, referral coupons), whole-house blocking via virtual Booking Rules ("Blocked: booked as …"),
  cleaning fee added to MotoPress total + "Cleaning fee" row, $75/pet/stay wording, referral codes
  (?ref= cookie 30 days, utm_* saved, auto-apply at checkout, no stacking with 7/28-night prices, booking meta box +
  "Code" column, payouts CSV), [acs_direct_badge], VacationRental JSON-LD for the 3 Rosella pages,
  Tools → Direct Pricing (rate table, Create Rosella drafts, Apply rates, Sync coupons, CSV).
  Live checks after install: /, /listings/, Bear Den, Why page, ?ref= → 200; Bear Den iCal export OK.
- Created (DRAFT): Accommodation Types **Moose Lodge #3256** (adults 6) and **Moose & Bear Lodge #3259** (adults 10),
  accommodations #3257 / #3260, rates (36 monthly Sun–Thu/Fri–Sat season prices each, seasons "Direct <Mon YYYY> …"),
  pages **#3258 /moose-lodge/** and **#3261 /moose-and-bear-lodge/** (copies of Bear Den page 1722, booking widget
  retargeted), 52 photos (Media IDs 3302–3353, alt text set), featured images 3302 / 3339.
  Coupons AURORA10 / VIVIAN10 created as DRAFT (10%, min 2 nights).
- iCal imports: Moose Lodge 1 = ML Airbnb+Vrbo + whole-house Airbnb+Vrbo; Moose & Bear Lodge 1 = all 7 Rosella feeds;
  **Bear Den (live, 1858) now also imports the whole-house Airbnb+Vrbo feeds** (additive blocking).
- Elementor DRAFTS on published pages (live unchanged): Bear Den 1722 (badge, whole-house + Moose Lodge cross-links,
  "door code on the day of arrival", 11 shared-space/exterior photos, "Read how Aurora & Cedar started →");
  Why page 3072 ("Stay at the Rosella duplex" → "Stay in Moose Lodge, home of the wall" → /moose-lodge/).
- QA: previews at 375/768/1280 no sideways scroll, badge + booking form render, 0 images without alt.
  NOT done: Lighthouse, a real checkout test (draft types can't be booked; do it right after publishing).

### Go-live steps (only with Andrew's OK)
1. Publish Accommodation Types 3256, 3259, then pages 3258, 3261.
2. Elementor → Publish the drafts of pages 1722 and 3072.
3. Tools → Direct Pricing → "Sync + turn referral codes ON".
4. Ops app: add Direct feeds for accommodation 3257 (FBX-10) and 3260 (FBX-ALL); deploy ops (classifies "Blocked:" as block).
5. GoDaddy → Flush Cache.
6. Test: whole-house 3-night quote (cleaning $180 row, nightly = table), AURORA10 = 10% of nights only,
   Bear Den 7 nights + AURORA10 refused, ?ref=AURORA10 prefilled, Moose Lodge dates blocked by a whole-house booking.
Rollback: deactivate nothing — set drafts back to draft; or restore the Nov-08 04:08 backup; plugin rollback = upload 0.2.3.

### Go-live run (2026-11-08, Andrew: "Yes, publish")
- Published: types 3256 (Moose Lodge), 3259 (Moose & Bear Lodge); pages 3258 /moose-lodge/, 3261 /moose-and-bear-lodge/;
  Elementor drafts of 1722 (Bear Den) and 3072 (Why page). Public HTML checked: badge, booking form, cross-links, "day of arrival".
- Referral codes AURORA10 / VIVIAN10 published. GoDaddy cache flushed.
- Ops: Direct feeds for 3257 (FBX-10) and 3260 (FBX-ALL) added; worker deployed (version e935b9ba).
- FIX found in testing: the 8% "Fairbanks Tax" (Bookings → Taxes & Fees) only covered Bear Den. Added Moose Lodge and
  Moose & Bear Lodge to it.
- Live quote tests (stopped before payment):
  - Whole house Feb 9–12 2027, 4 guests: $810 nights + $64.80 tax + $180 cleaning = $1,054.80.
  - Same + AURORA10: −$81 (10% of nights), tax $58.32, cleaning untouched → $967.32.
  - Bear Den Mar 2–9 2027 (weekly 10%) + AURORA10: refused ("can't be combined with the weekly or monthly price").
  - /moose-lodge/?ref=AURORA10 → coupon field pre-filled at checkout; Moose Lodge 3 nights $387 + $100 cleaning.
  - Whole house Nov 8–11 2026 refused (Bear Den's Airbnb guest blocks it through the cross-import).
- NOT tested: a direct website booking blocking the other two units (needs a real booking; do it with Andrew).
- FOUND (pre-existing): Bear Den's own Airbnb iCal marks 2027-01-25 → 2027-11-09 "Not available" (Airbnb availability
  window), so the website blocks Bear Den — and the whole house, which imports that feed — from Jan 25 2027.
  Fix on Airbnb: Bear Den → Availability → raise the availability window (e.g. 12 months).

### QC + fixes (2026-11-08, after "I don't see the Rosella listings")
- Listings page (Elementor page 40): added a row with Moose Lodge and Moose & Bear Lodge (Whole House) cards, copied from
  the Bear Den card (photo, specs, `[acs_from_price]`, Book Now link). Live: $122 / $216 per night.
- Bear Den Airbnb: Jan 25 – Nov 8, 2027 were "Blocked by you" on Airbnb (not Booking.com). Opened them on Airbnb.
- BUG FIXED (double-booking risk): importing the same Airbnb/Vrbo calendar into two website listings makes MotoPress
  delete the other listing's copy as "outdated" (the whole-house sync deleted Bear Den's Nov 6–10 guest, so the site quoted
  Bear Den for occupied nights). Each Rosella listing now imports only its own Airbnb + Vrbo + Booking.com calendar:
  Bear Den 1858, Moose Lodge 3257, whole house 3260.
- acs-site 0.3.1 → 0.3.6:
  - Family blocking now also reads imported bookings, but only real guests: Airbnb/Vrbo "Reserved" and Booking.com
    "CLOSED"; skips Airbnb "Not available" / Vrbo "Blocked" placeholders (MotoPress stores the summary in quotes).
    Otherwise Moose Lodge would be blocked every time Bear Den is booked (Airbnb mirrors it onto the whole house).
  - Blocks are rebuilt per request (the 10-min cache went stale mid-import).
  - Tools → Direct Pricing: read-only "Rosella blocking check" table.
  - "Extend Bear Den prices" button: Bear Den-only seasons Jul 1 2027 – Apr 30 2028 ($125, Fri–Sat $160, same weekly/
    monthly). Ran it. The shared "All Season"/"Weekends" seasons still END 2027-06-30 for every other listing.
- Verified live: Bear Den + whole house refused tonight (Bear Den guest); Moose Lodge Nov 12–15 $517.96; Bear Den
  Mar/Jul 2027 and Mar 2028 bookable; whole house Feb + AURORA10 = $967.32; ?ref prefill; Listings page 375/768/1280 OK.
- Ops app: Booking.com calendars for Moose Lodge and the whole house exist on the website but are not in the ops app yet.
