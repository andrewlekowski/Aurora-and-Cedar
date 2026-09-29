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
