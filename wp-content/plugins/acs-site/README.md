# ACS Site Customizations: install and test (staging first)

**Untested against the live MotoPress version.** It was written offline and has only been syntax-checked, plus a stub test of the price shortcode. Install it on the WPvivid staging copy and go through this list before touching live.

Install: zip the `acs-site` folder → Plugins → Add New → Upload → Activate. Rollback: deactivate the plugin (nothing is written to the database except the price transients and the per-home time fields).
If the phase-1 `mu-plugins/acs-review-count.php` is installed, delete it. This plugin includes the same shortcode.

| # | Feature | How to use | Staging test |
|---|---|---|---|
| 1 | `[acs_review_count]` | Put in any text widget | Shows 765; `wp option update acs_review_count 780` → shows 780 |
| 2 | No-cache booking pages | Add the 10 other listing page IDs to `listing_page_ids` in `acs_config()` | Logged-out `curl -I` on a listing twice shows `X-ACS-Cache: bypass` and `Cache-Control: no-cache…`; availability check → checkout works |
| 3 | `[acs_from_price type="ROOM_TYPE_ID"]` | Replace every hard-coded "$X/Night" (11 listings, Listings 40, Home 23) | Change a rate on staging → all spots update after save; live value = a real 1-night weeknight quote |
| 4 | `[acs_pet_fee_notice]` + checkout estimate | Shortcode above the booking form on pet-friendly listings | At checkout, enter 2 pets, 5 nights → "2 pets × 5 nights × $20 = $200"; 30 nights → "$399 first pet + 1 × $100 … = $499". If nothing appears, fix `pet_field_selector` |
| 5 | Per-home check-in/out | Fill the "Check-in / check-out (this home)" box on each Accommodation Type; `[acs_checkin_times type=ID]` on listings; `%acs_check_in_time%` / `%acs_check_out_time%` in the email template | Send a test booking email; if the tags print literally, MPHB's email filter names differ, so check `EmailTemplater` in the installed version |
| 13 | Clearer messages | Automatic | Search taken dates → "Those dates are taken…". Add more stock strings to the `$map` as you find them. The min-stay message isn't mapped yet: capture MPHB's exact string on staging first |
| 9 | GA4 events | Needs Site Kit's gtag | Tag Assistant: `check_availability` on form submit, `begin_checkout` on checkout, `booking_complete` with value on reservation-received |
| 10 | Schema | Brand schema is automatic on Home. Fill `acs_listing_schema()` with **verified** facts per listing. FAQ: turn on "FAQ Schema" in the Elementor accordion | Rich Results Test on Home, one listing, FAQ |
| 10b | noindex on checkout/search/confirmation | Automatic. Remove this section if Rank Math/Yoast also sets it | View source on checkout: `noindex, follow` |
