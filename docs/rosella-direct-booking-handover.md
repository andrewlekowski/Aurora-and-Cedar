# Handover prompt: keep the direct-booking website in sync with the Rosella channel listings

Paste everything below the line into a new Claude Code session (desktop app, Chrome extension connected,
signed in to WordPress, Airbnb, Vrbo and Booking.com in Chrome).

---

You are helping Andrew (Aurora & Cedar Stays) keep his **direct-booking website** in the rotation of listings he
maintains. Whenever he updates a Fairbanks "Rosella" listing on Airbnb, Vrbo or Booking.com, make the matching update
on **auroraandcedarstays.com** (WordPress + MotoPress Hotel Booking 4.6 + Elementor, hosted on GoDaddy), and keep the
ops app and calendars consistent. Andrew is not technical: explain in plain words, ask before anything public or
destructive, and never paste secrets (iCal tokens, passwords) into chat or into a repo.

## The three products (10 Rosella Ave, Fairbanks, AK 99701)
| Product | Website page (Elementor id) | MotoPress type / room | Airbnb listing | Vrbo | Booking.com | Ops app code |
|---|---|---|---|---|---|---|
| Bear Den (upstairs, 1BR/1BA, 4 guests) | /rental-unit-in-fairbanks/ (1722) | 1857 / 1858 | 1602468684067214615 | 5070508 | 15821556 | FBX-10.5 |
| Moose Lodge (main level, 2BR/1BA, 6 guests) | /moose-lodge/ (3258) | 3256 / 3257 | 1807519326390004685 | 5560202 | 17614143 | FBX-10 |
| Moose & Bear Lodge (whole house, 3BR/2BA, 10 guests) | /moose-and-bear-lodge/ (3261) | 3259 / 3260 | 1814045454997774857 | 5560190 | 17614142 | FBX-ALL |

Other website places that mention them: Listings page (Elementor page 40, one card each: photo, title, specs,
`[acs_from_price type="…"]`, Book Now link) and "Why Aurora & Cedar?" (page 3072, links to Moose Lodge).

## Where things live
- Website repo: `~/aurora-and-cedar` (GitHub andrewlekowski/Aurora-and-Cedar). Change log: `website-fix-log.md` (read it first).
- Custom plugin: `wp-content/plugins/acs-site/` — `includes/direct-booking.php` holds `acs_direct_config()`:
  `DIRECT_DISCOUNT` (0.10), the monthly Airbnb rate tables `[Sun–Thu, Fri–Sat]` for Moose Lodge and the whole house,
  date `overrides`, cleaning fees ($100 / $180), pet fee ($75 per pet per stay), the Rosella family, referral codes.
  Deploy = bump the version in `acs-site.php`, zip the `acs-site` folder, WP → Plugins → Add New → Upload → "Replace
  current with uploaded". Then GoDaddy admin bar → Flush Cache.
- WP Tools → **Direct Pricing**: shows the price tables, "Apply rates to MotoPress", "Extend Bear Den prices", referral
  codes, payouts CSV, and a read-only **Rosella blocking check**.
- Bear Den prices are hand-set in MotoPress → Rates (rate 1874: $125 Sun–Thu, $160 Fri–Sat, 10% weekly, 20% monthly);
  Bear Den-only seasons run to 2028-04-30. Bear Den cleaning fee is a MotoPress fee ($90). 8% "Fairbanks Tax"
  (Bookings → Taxes & Fees) covers all three.
- Ops app: `~/Downloads/aurora-cedar-ops` (Cloudflare Worker `aurora-cedar-ops`, D1). Cleaning checklists:
  `scripts/checklists.json`, whole house built by `scripts/checklists/rosella_whole_house.py`; calendar docs in
  `docs/direct-booking-calendars.md`. Load checklist changes with an `UPDATE properties SET checklist=…` via
  `npx wrangler d1 execute aurora-cedar-ops --remote --file …` (never commit tokens).

## Every time Andrew changes a Rosella listing on a channel, check and mirror on the website
1. **Title / description / "The space" / house rules / check-in & check-out times / cancellation wording** → edit the
   matching Elementor page (open `wp-admin/post.php?post=<id>&action=elementor`, change widget settings with
   `$e.run('document/elements/settings', …)`, save as **draft** first with `$e.run('document/save/draft')`, show Andrew
   the preview, publish with `$e.run('document/save/update')` only after he says so). Keep the Listings-page card title in step.
2. **Photos** → upload to Media with alt text, update the page carousel (Airbnb order) and the Listings-page card photo.
3. **Amenities / bed layout / max guests** → page amenity list + Listings card specs; MotoPress type capacity
   (adults); the ops cleaning checklist if bed/towel counts change (whole house: 10 bath towels + 10 washcloths).
4. **Prices** → website direct price = Airbnb price × 0.90, rounded. Moose Lodge & whole house: update the monthly
   table / `overrides` in `acs_direct_config()`, deploy, then Tools → Direct Pricing → **Apply rates**. Bear Den: edit
   MotoPress rate 1874. Check the "From $X/Night" on each page and Listings card, and that the "Book direct and save"
   badge is true (direct must be below Airbnb).
5. **Fees** (cleaning, pet, extra guests) → config / MotoPress fees so the website matches Airbnb.
6. **Min/max nights, advance notice, availability window** → MotoPress Booking Rules (site-wide 3-night minimum
   exists) — keep the website no looser than the channels.
7. **Never** put the Wi-Fi password on the public site, and never advertise Airbnb's new-listing 20% promo.
8. After publishing: flush the GoDaddy cache, load each page logged out (no horizontal scroll at 375/768/1280, every
   image has alt text), and run a test quote up to checkout (no payment): nights, 8% tax, cleaning fee, AURORA10 = 10%
   of nights only and refused on weekly/monthly stays.
9. Log what changed in `website-fix-log.md`, commit and push both repos.

## Calendars (do not undo this design)
- **Like-with-like**: every Airbnb / Vrbo / Booking.com listing imports only the SAME listing from the other channels plus
  that listing's website calendar `https://auroraandcedarstays.com/?feed=mphb.ics&accommodation_id=<1858|3257|3260>`.
  The website imports only each listing's own Airbnb + Vrbo + Booking.com calendar (WP → Bookings → Sync Calendars).
- Suite ↔ whole-house blocking = Airbnb parent-child link + the website relay (plugin publishes BLOCKED dates for real
  stays of related listings; "Export admin blocks" must stay ON in MotoPress → Settings → General). Never import one
  calendar into two website listings — MotoPress then deletes the other listing's bookings as "outdated".
- Vrbo allows max 5 imports per property. If Andrew creates a new channel listing or iCal link, add it like-with-like
  on every channel and on the website, check the fingerprint (sha256 first 10 chars) instead of showing the link.
- Verify with Tools → Direct Pricing → Rosella blocking check and the website calendar exports.

## Open due-outs carried over (as of 2026-11-08)
1. **Booking.com, Moose & Bear Lodge (17614142)**: request the **location-verification letter** mailed to
   10 Rosella Ave (Andrew asked for this; it was interrupted before submitting), then enter the code when it arrives —
   the listing is "Closed/Not bookable" until then.
2. **Booking.com, Moose & Bear Lodge**: room type says **"Four-Bedroom House"** — change to a 3-bedroom house
   (queen + full + queen; two 6" floor mattresses stored in closets). Andrew asked for this; not done yet.
3. **Direct prices vs Airbnb**: Airbnb currently shows about $87–$110 (Moose Lodge) and $147–$171 (whole house) a night
   in Nov 2026, but the website starts at $122 and $216 from the older approved table — "Book direct and save" is not true
   right now. Once Andrew's channel price updates are done, rebuild the two monthly tables from current Airbnb prices
   (× 0.90) and Apply rates. Re-check Bear Den too ($125/$160 vs Airbnb $99–$138).
4. **Website prices end 2027-06-30 for the other 9 (Washington) listings** — shared seasons "All Season" and
   "Weekends (Fri–Sat)" stop then. Ask Andrew whether to extend them.
5. **Moose Lodge cleaning checklist (FBX-10)** is still version "draft-2026-11-08" — Andrew to review, then mark final.
   Whole-house checklist v1 is live.
6. **Andrew's calls still open**: cedar-wall wording on Moose Lodge (cedar/antler wall is in the living room; the moose
   painting is in the queen bedroom), the amenity lists adapted for the two new pages, weekly/monthly discounts for
   Moose Lodge and the whole house (Bear Den has 10%/20%), extra-guest fees on the website.
7. **One live end-to-end test**: a real direct whole-house booking should block both suites on the website and, through
   the calendars, on Airbnb, Vrbo and Booking.com within ~1 hour. Needs Andrew present (real booking, then cancel).
8. Optional: Lighthouse check of the three pages; show referral codes in the ops app (today: WordPress booking + payouts CSV).
9. Noticed, not changed: Booking.com Bear Den says "add availability past 29 Aug 2027"; Vrbo Bear Den base rate $200
   and Vrbo Moose Lodge $150 look out of line with Airbnb — confirm with Andrew while he updates prices.

Start by asking Andrew which listing(s) and channel(s) he just changed and what changed, then work the checklist above
for those items, preview first, publish on his OK.
