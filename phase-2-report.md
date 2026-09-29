# Phase 2 report: auroraandcedarstays.com (Sep 29, 2026)

**Nothing is live yet.** Neither phase 1 nor phase 2 could run from this cloud session. It has no Claude in Chrome, and its network policy blocks the site, Airbnb and wordpress.org. Every wp-admin, Google and PageSpeed step still needs a Chrome session on Andrew's computer.

## Built and ready (in this repo)
- **`wp-content/plugins/acs-site/`**: the "ACS Site Customizations" plugin, one section per feature:
  - #2: no-cache headers on booking pages
  - #3: `[acs_from_price]`, computed from MPHB rates
  - #4: pet-fee notice, plus a display-only checkout estimate that uses the 28-night rule
  - #5: per-home check-in/out fields, a shortcode and email tags
  - #13: clearer "dates taken" and fallback error messages
  - #9: GA4 `check_availability` / `begin_checkout` / `booking_complete` (with value)
  - #10: LodgingBusiness schema and noindex on utility pages
  - Also includes `[acs_review_count]`.
  The install steps, a staging test for each feature, and the rollback step are in its `README.md`. It passes a syntax check and a stub test of the price logic, but it's **untested against the real MPHB**, so it goes on staging first.
- **`copy/monthly-health-check-prompt.md`**: the ready-to-paste scheduled-task prompt for #14, with setup steps.
- Phase 1 copy, updated with Andrew's answers, including "Army aviation veteran, former Apache pilot".

## Not started (needs Chrome on Andrew's computer)
- #1: remove Sami's account and set up 2FA
- #6: cross-streets list and maps
- #7: MotoPress diff and clean update
- #8: PageSpeed before/after
- #9: Site Kit sign-in
- #10: SEO plugin, titles and alt text
- #11: landing pages. Their facts need verifying on Google Maps.
- #12: WELCOMEBACK coupon
- All of phase 1's live edits

## Waiting on Andrew
- Staging approval for #3, #5 and #7, once they've been tested
- Coupon amount: 5% is the default, and he can raise it
- The cross-streets list, once it's been drafted
- Whether to delete Sami's account and move its content to Andrew
- His own sign-ins for 2FA, Site Kit and Search Console
- From phase 1: the suggested pet house rules, and the base names on the Monthly Stays page

## Suggested one-liner for Airbnb/Vrbo checkout instructions
> Thanks for staying with us! Next time, book direct at AuroraAndCedarStays.com with code WELCOMEBACK and save.
(Only once the coupon is live.)
