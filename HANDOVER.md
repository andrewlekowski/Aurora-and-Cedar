# Handover: Aurora & Cedar site work (updated Sep 28, 2026, ~10 PM AKDT)

**Latest (Sep 28, ~10:45 PM AKDT): LIVE.** With Andrew's OK, acs-site v0.2.0 was installed and activated on live after a fresh WPvivid backup (**Sep 29 05:40** server time, 255.51 MB). The GoDaddy cache was flushed. Logged-out live checks: all main pages 200; search results show 8 cards with Book Now forms and discounts; Book Now → checkout (Fairbanks, 2 guests, badge, back link, $1,008.54). **11/11 live totals match the pre-install quotes to the cent.** WELCOMEBACK + weekly on live: −$42.53, total $962.61, savings $137.03. Search results and checkout are sent `no-cache` with `X-ACS-Cache: bypass`. Still untested: mobile width, confirmation email (needs a real booking). Note: live WPvivid auto-updated to 0.9.136 this evening; MotoPress is still 4.6.0.

Stopped mid-task at Andrew's request. **Nothing from the checkout-discount / Book Now task (`tasks/checkout-discount-and-booking.md`) is on the live site.** Nothing is committed yet (see "Repo state").

## Backups
- Live WPvivid backups (Database + Files, manual-delete only): **Sep 29 01:13** and **Sep 29 04:15** server time. The 04:15 one was taken before the checkout task started.

## Staging (`/mystaging01`): working, with caveats
Created with WPvivid. It was returning HTTP 500 and was fixed through GoDaddy File Manager, with changes **inside `/mystaging01/` only**:
- `wp-config.php`: an isolation block above the hosting require sets ABSPATH, WP_HOME/SITEURL `/mystaging01`, the content/plugin/mu dirs and URLs, `WP_CACHE false`, `DISABLE_WP_CRON true` and `WP_ENVIRONMENT_TYPE staging`. The require path is `/../../configs/wp-config-hosting.php`, and `$table_prefix = 'wpvividstg01_'` is **uncommented**. Without that last line staging would use the live tables.
- Renamed to `*.staging-disabled`: `wp-content/object-cache.php`, `mu-plugins/gd-system-plugin.php`, `mu-plugins/object-cache-pro.php`.
- Permalinks on staging are set to **Plain** (`?page_id=`). This server ignores per-folder rewrites, so pretty URLs under `/mystaging01/` fall through to the live site. Test with `/mystaging01/?page_id=…`: Home 23, Listings 40, Search Results 1827, Checkout (Booking Confirmation) 1829, Fairbanks 1722.
- Verified isolation: staging media 1244 has an empty alt text and live has the new one, so the two use separate tables.
- Staging needs its own WP login (username + password; no GoDaddy SSO there). Andrew is logged in.
- If WPvivid ever recreates staging, redo all of the above.
- Staging now also has coupons enabled and a WELCOMEBACK coupon (post 2928: 5%, all 11 homes). Both are verified.

## Checkout task: status
Code is in `wp-content/plugins/acs-site/` (v0.2.0). New sections are at the end of `acs-site.php`, plus the `templates/city-search/` and `assets/city-search.*` files.

| Part | Status |
|---|---|
| **15. City search moved out of MotoPress** | Done and working on staging. The hand edit was `motopress-hotel-booking/plugin.php` lines 469-472 plus `includes/airbnb-search/`, `templates/airbnb-search/` and `assets/*/airbnb-search.*`. The same code now lives in acs-site, and on `mphb_loaded` it unhooks the MotoPress copy (same shortcode, taxonomy, meta keys and CSS classes). The MotoPress files were **not edited**. They can be deleted by a clean MotoPress reinstall later. |
| **16. Discount display (A)** | Working on staging. **All 30 test quotes** (11 homes; short/min-stay, 7+ night weekly, 30-night monthly) have **totals identical to the pre-change baseline**, a badge only on 7+ nights, every night crossed out, and "before − discount = Dates Subtotal" math that checks out. AJAX re-render (guest count 2→3) keeps the display and the total. Email decoration is written (`mphb_email_replace_tag`) but **not tested**. |
| **17. Book Now → checkout (B)** | Results cards on staging have the POST form (MPHB's field names confirmed from its own booking form) and a "View details" link with the dates. **Not yet click-tested end to end.** The unavailable/min-stay redirect, the prefill on the listing, the notice banner and the back link are written but **untested**. |

### Two fixes (uploaded to staging at 9:30 PM, verified)
1. The expand icon rendered as literal `&plus;`, because libxml doesn't know HTML5 entities. Named entities are now converted to numeric before parsing.
2. "Nightly rate before discount" amount was green. It now has its own class (`acs-before-amount`).

Rebuild the zip (`cd wp-content/plugins && zip -r ../../acs-site.zip acs-site`) → staging Plugins → Add New → Upload → "Replace current with uploaded".

## Staging test results (Sep 28, 9:30-10 PM)
- **Discount display:** 30/30 quotes match the baseline to the cent. The badge shows only on 7+ nights; every night is crossed out; before − discount = Dates Subtotal.
- **The `&plus;` icon and the before-amount colour** are fixed and verified.
- **AJAX:** changing the guest count (2→3) replaces the table and keeps the display, with the same total.
- **WELCOMEBACK + weekly (Fairbanks, 7 nights):** coupon −$42.53. MPHB's Total and its "Total Price" field both read $962.61. The savings line reads "$137.03 … weekly discount and coupon WELCOMEBACK" ($94.50 + $42.53).
- **Book Now from results:** a real click (Fairbanks, 3 guests) plus a scripted sweep of all 30 cases. All landed on checkout with the right home, dates and guests preselected, a Back link to the same filtered results and a total equal to the baseline. The browser Back button returns to the same results.
- **Forced min-stay failure** (1845, 5 nights) → redirected to its listing page (1424) with the dates, `acs_notice=rules` and the message.
- **Listing "Confirm Reservation":** posts the same fields to checkout as the tested direct POSTs, so the discount display is the same code path. Not clicked through the datepicker UI.
- **NOT tested:** mobile width (the window resize didn't apply; the CSS has the original 760px breakpoints); logged-out (staging requires a login, so check logged-out on live right after pushing); the confirmation email (it needs a booking created after the change, and the rules forbid real bookings; old bookings are correctly unchanged); the no-dates card (the search form requires dates, so it only shows if a guest arrives without them).
- **Staging listing photos are blank** on the results cards. That's a staging image/lazy-load quirk, not caused by this change (the same template code as before).
- **Screenshots:** `screenshots/before-7-night-fairbanks.jpg`, `before-30-night-fairbanks.jpg`, `after-7-night-fairbanks.jpg`, `after-30-night-fairbanks.jpg`, `after-7-night-fairbanks-with-welcomeback.jpg`, `after-search-results.jpg`.

### Previously remaining test matrix (for reference)
- WELCOMEBACK coupon at checkout: the savings line should add stay discount + coupon, and the total should equal MPHB's own total.
- Book Now from Home search and from Listings search, for 3/5-night (min stay), 7-night and 30-night stays. It should land on checkout with the room, dates and guests set, and Back should return to the same results.
- City filter with no dates → Book Now goes to the listing page.
- Listing page "Check availability → Confirm Reservation" for 7 and 30 nights shows the discount.
- Forced failure (e.g. a POST with dates that break the min stay) → redirect to the listing with the message and the dates prefilled.
- Mobile width, logged-out, and the confirmation email preview.
- Min stays: 1839=7, 1841=5, 1843=9, 1845=10, 1847=6, 1849=5, 1851=5, 1853=5, 1855=4 (booked in Nov; use Dec 1), 1857=3, 1891=5.
- Baseline totals are saved in the staging tab's localStorage (`acs_baseline2`), and the after-change results in `acs_after`. The key numbers are also in the table below.

| Home | Short | Weekly (Nov 10 +7, or +min) | Monthly (Nov 10 → Dec 10) |
|---|---|---|---|
| 1839 | – | $1,080.49 | $3,845.31 |
| 1841 | $1,071.75 | $1,286.61 | $4,622.88 |
| 1843 | – | $1,752.17 (9n) | $5,062.22 |
| 1845 | – | $1,301.76 (10n) | $3,321.36 |
| 1847 | $1,021.26 | $1,054.36 | $3,743.23 |
| 1849 | $858.57 | $1,034.16 | $3,671.42 |
| 1851 | $2,154.72 | $2,583.32 | $9,281.66 |
| 1853 | $4,298.22 | $5,156.55 | $18,527.42 |
| 1855 (Dec 1 start) | $1,387.64 | $2,084.91 | $7,450.84 |
| 1857 Fairbanks | $495 | $1,008.54 | $3,571.92 |
| 1891 Duplex | $2,466 | $2,969.10 | $10,641.44 |


### Then (next step)
Push to live only after Andrew says yes. The live push is: 1) a fresh WPvivid backup of live; 2) Plugins → Add New → Upload `acs-site.zip` → Activate (live has no acs-site yet); 3) GoDaddy Flush Cache; 4) logged-out check with `?cb=` on Home search → results → Book Now → checkout, plus a 7-night quote total vs the table; 5) confirm the checkout, booking-confirmation and search-results pages aren't cached. Show Andrew the before/after shots and the test results, and **ask before pushing to live**. Rollback is to deactivate ACS Site Customizations. With MotoPress's hand-edited copy still present, that also brings the old city search back automatically. Alternatively set `city_search` / `discount_display` / `results_checkout` to false in `acs_config()`, or restore the 04:15 backup.

## Also done tonight on LIVE (see website-fix-log.md for details)
- **Phase 1 is complete:**
  - Home, About (with the family photo), FAQ, Pet policy and the Refund policy (with Andrew's notes kept).
  - Monthly Stays page published and added to the nav and footer.
  - MPHB date and time settings, cleanup (moved to trash), and the pet-fee message.
- **WELCOMEBACK coupon:** 5%, all homes. MPHB "Enable the use of coupons" is turned **on**. Not tested at checkout.
- **Alt text:** added to the 95 images the site shows, and verified live.
- **Drafts only, waiting on Andrew:**
  - `copy/06-cross-streets.md`: whether to hide exact addresses, and whether to rename the Rosella guide.
  - `copy/10-seo.md`: the SEO plugin choice (Yoast is recommended), via staging.
- **acs-site on live:** still NOT installed. Live has neither v0.1 nor v0.2.
- **Not done:** the PageSpeed baseline (the API was rate-limited), and 2FA / Site Kit (these need Andrew).

## Repo state (uncommitted)
- Modified: `website-fix-log.md`, `phase-2-report.md`, `wp-content/plugins/acs-site/acs-site.php`.
- New: `acs-site/templates/`, `acs-site/assets/`, `copy/06-cross-streets.md`, `copy/10-seo.md`, `screenshots/`, `acs-site.zip`, `HANDOVER.md`, `tasks/checkout-discount-and-booking.md` (checked out from `origin/claude/clever-darwin-w9fq5f`).
- The task file asks for a commit + push when done. That hasn't happened yet.

## Open browser tabs
- GoDaddy File Manager (signed in).
- Live WPvivid.
- Staging (logged in), last on the new-coupon screen with nothing saved.
