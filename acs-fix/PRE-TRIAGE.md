# Audit pre-triage (desk review, no live access)

Written Sep 29, 2026 from a cloud session that **cannot reach the site** (network policy 403) and has **no SSH**. Nothing here was checked on staging or production. This is not VERIFY.md: it only tells the fix run on Andrew's Mac where to look first. Every status below still needs live verification.

Sources: `audit.md`, `HANDOVER.md`, `website-fix-log.md`, `wp-content/plugins/acs-site/acs-site.php` (v0.2.1).

## Timing matters
- The audit's form tests ran **Sep 28, 21:14–21:15 AKDT**.
- Phase 1 content (FAQ, pet policy, About, Monthly page, MPHB times) went live around **17:13 AKDT** (WPvivid backup 01:13 server time, which is UTC). That's before the audit. So where the audit still reports those defects, it may have seen a cached CDN copy. Or an Elementor edit may not have stuck. Verify with `?cb=`.
- acs-site **0.2.0** (search result Book Now → checkout, discount display, no-cache on booking pages) went live around **22:45 AKDT**, **after** the audit. 0.2.1 (28+ night notice) and the refund-policy line came later still.

## Likely stale (expected NOT REPRODUCED; verify)
| Audit item | Why it's probably fixed | Check |
|---|---|---|
| ACS-001: result Book Now drops dates, guests and price | acs-site §17 posts result cards straight to checkout (went live after the audit) | B1: Nov 2–5, 1 guest → Book Now lands on checkout with the same total |
| ACS-001/B2: property widget "An error has occurred" | §2 sends no-cache + `X-ACS-Cache: bypass` on listing pages. The code comment says cached copies carried expired MPHB nonces. The fix went live after the audit | B2: compare cached and bypassed loads; capture the admin-ajax response |
| ACS-012: FAQ Wi-Fi/kitchen repeats parking | Fixed on FAQ 102 before the audit | Open the accordion on `/faq/?cb=` |
| ACS-005 (pet part): pet-policy placeholders | Pet policy 2124 was replaced | grep for `[` on `/pet-policy/` |
| ACS-005 (refund part): refund bracketed date | Refund 2012 has a new effective date | Only the other four policies should still have brackets (F4) |
| About "active-duty" | Replaced with "Army aviation veteran, former Apache pilot" | grep "active" on About, FAQ, property pages |
| Fairbanks "up to five" guests | Log: 1722 says "up to 4 guests"; room type 1857 has 4 adults | Also run B3 (30-guest search). Adults alone may not cap the total guest count |
| Monthly Stays missing from the header | Added to the Header menu and footer 1592 | Older templates may use a different header (ACS-011 → Theme Builder, out of scope) |
| Checkout shows no discount / no long-stay info | §16 and §18 are live | Only B7 tax question remains |

## Probably still open (fix run items)
| Audit item | Run item | Notes |
|---|---|---|
| ACS-002: 30-guest search returns Fairbanks | B3 / F10 | The search guest field may map to adults with no total cap. acs-site §15 builds the search (`mphb_adults`) and can filter by capacity |
| ACS-003: three price contexts | F9 | Log: Home cards $360/$130/$155 "match MPHB rates 1893/1865/1866", but Listings shows $504/$147/$196, and Fairbanks and DuPont both show $410. Probably hard-coded Elementor text. Use `[acs_from_price]` |
| ACS-006: "light rail" ×5 | F1 | Puyallup pages |
| ACS-007: ZIP 98344 | F2 | Listing page 1265 (log confirms) |
| ACS-026: "Hightlights", "Essentials" not included | F3 + D6 | "Essentials" is an amenity config question → D6 |
| ACS-005: brackets on the other 4 policies | F4 | Privacy, cookie, terms, accessibility |
| ACS-015/016/027: indexable system, author and archive pages; sitemap | F5 | Existing §10b only covers the nocache slugs (checkout, search-results, booking-confirmation…). Author, amenity/city archives, `my-account`, `booking-cancellation`, status children and sitemap removal are not covered |
| ACS-016: author archive `/author/ch-samikamboh22gmail-com/` | F5 + REPORT security | The slug exposes Sami's Gmail. Removing the account is Andrew's job, not the run's |
| ACS-017/018/020/028: labels, gallery targets, 768 overflow, `#` anchors | F6 | Audit: 768 overflow is in the footer inner/icon-list containers (client 753 vs scroll 786) |
| ACS-019: no H1 on property pages | F7 | |
| ACS-014: no meta descriptions | F12 | No SEO plugin installed (log). Drafts are in `copy/10-seo.md`. Audit says 0/69 JSON-LD, but §10 schema was live only after the audit |
| ACS-010: past dates selectable; one-night "Nothing found" | B4 | Min stays per the handover: Fairbanks 3, DuPont 4, others 5–10 |
| DuPont 10 guests / 5 PM–10 AM | F10 / F11 | Audit says Google shows 8 guests. Ground truth is 10; OTA/Google listings are out of scope |

## Not in this run (per the prompt)
- ACS-008 phone field: must stay required.
- ACS-009 and §16 tracking, ACS-022 consent, ACS-023 landing pages, ACS-021 performance, ACS-011 header unification, ACS-025 channel sync, Google Vacation Rentals.
- ACS-004 pet fee in the total: fee config must not change. The fee is collected after booking by design, and acs-site §4 already shows an estimate.

## Audit statements that conflict with ground truth or look wrong
- Audit §10 says the author archive title "exposes Andrew@AuroraAndCedarStays.com", while the slug is Sami's Gmail. Check both.
- Audit §6 asks for Reply-To to `Vivian.c.lekowski@gmail.com`. That's not in the owner contact list (Hello@, Andrew@, Vivian@AuroraAndCedarStays.com). Don't change form routing from this.
- Audit checkout sample (Fairbanks Oct 1–4): tax $35.60 on a $535 subtotal is about 8% of the $445 room only, not of the $90 cleaning fee. The prompt already flags this for Phase 1 (report only).
