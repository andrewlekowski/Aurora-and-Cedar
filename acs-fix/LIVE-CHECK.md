# Live spot-check against the audit (Sep 28, 2026, ~11:30 PM AKDT)

Checked on production (logged out, `?cb=`), with read-only admin views for calendar sync. Nothing was changed. This checks `PRE-TRIAGE.md` against the live site; the fix run should still verify before changing anything.

## Fix run, Sep 29 (after this check): all "still broken" items below are now FIXED on live
ZIP 98444 (Home, Listings, 1265 + map); Sounder commuter-rail (5 pages); Highlights (1722); policy dates without brackets (4 pages); one H1 on all 11 listings; meta descriptions (17 pages); author archive 301 → home; sitemap = pages + accommodation types only; users REST hidden logged out; search enforces party size (with 4 Apts 24 and Duplex 15 per Andrew); DuPont 5 PM/10 AM + "sleeps up to 10"; card prices from `[acs_from_price]` (values unchanged); footer 768px overflow, `#` links and gallery targets fixed. Details: website-fix-log.md.

## Confirmed fixed (audit is stale)
- **B1 / ACS-001:** a search for Nov 2–5 with 1 guest returns 1 home (other homes' min stays are 4+ nights). Its Book Now is the acs-site checkout form. Tonight all 30 dated cases landed on checkout with unchanged totals.
- **ACS-012:** the FAQ parking answer appears once (no Wi-Fi/kitchen duplicate).
- **ACS-005 (pet):** no `[...]` placeholders on /pet-policy/.
- **ACS-005 (refund):** no brackets on /refund-cancellation-policy/.
- **About:** no "active duty".
- **Fairbanks copy:** "up to 4 guests".
- **B6 calendar sync:** all 11 homes have an Airbnb iCal import. MPHB sync runs on its 15-minute schedule, and the latest runs (07:01 and 06:47 UTC Sep 29) are DONE for all 11. The 06:47 run had 1 failed item each for CHIC and the DuPont 4BR; the 07:01 run had none. Unverified: whether Vrbo/Booking.com feeds are attached (the counter picked up page text, not feed URLs). Duplex, 2 Apts and 4 Apts showed Airbnb only.

## Confirmed still broken
- **ACS-002:** a search for **30 guests** (Nov 10–17) returns 8 homes: 1839, 1841, 1847, 1849, 1851, 1853, **1857 Fairbanks**, 1891. Capacity isn't enforced in search. → B3 / F10.
- **ACS-005:** **"[June 9, 2026]"** still shows on /privacy-policy/, /cookie-policy/, /terms-of-service/, /accessibility-statement/. → F4.
- **ACS-006:** "light rail" appears on 5 pages: 4 Apts (1536), basement studio (1481), Puyallup 2/1 (1449), 2BD w/ backyard (1424), CHIC (1365). → F1.
- **ACS-007:** **98344** appears on **Home, Listings and 1265**. The pre-triage only listed 1265. The Home/Listings card addresses need F2 too.
- **ACS-026:** "Hightlights" on Fairbanks (1722). → F3.
- **ACS-019:** **no H1** on any of the 11 listing pages. → F7.
- **ACS-014:** **no meta description** on Home, Listings, or any listing page. → F12 (drafts in copy/10-seo.md).
- **ACS-016:** **/author/ch-samikamboh22gmail-com/** returns 200 (Sami's Gmail in the URL). → F5; account removal is Andrew's.
- **ACS-015/027:** the core sitemap lists pages, mphb_room_type, **mphb_room_type_facility (amenities), mphb_city, users**. The last three should come out. → F5.

## Not reproduced / changed since the audit
- **ACS-003 "$410 on Fairbanks and DuPont":** not seen. Home cards show $360/$130/$155. Listings cards show $360, $130, $155, $120, $125, $310, $620 and $260 per night. Those are still hard-coded Elementor text (F9 → `[acs_from_price]`), but no shared $410 was found. The Fairbanks page also contains "$20/night": that's the pet fee, which is correct.

## Not checked here
The B2 widget error (needs datepicker clicks), B4 past dates, B5 Stripe key prefix, tax (B7/M4), 768px overflow, gallery targets, icon labels, footer `#` links, SPF/DMARC, and the author archive title text.
