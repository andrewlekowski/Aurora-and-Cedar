# Checkout discount display + search-to-booking fix: auroraandcedarstays.com

You are working on Andrew Lekowski's direct-booking site for Aurora & Cedar Stays (11 rentals, WA + AK). It runs WordPress on GoDaddy managed hosting, with Elementor + ElementsKit and MotoPress Hotel Booking (MPHB). Two jobs:

- **A.** Make the weekly/monthly discount visible at checkout.
- **B.** Make "Book Now" on filtered search results go straight to checkout with the guest's dates.

## Before you start
- Read `website-fix-log.md` and `wp-content/plugins/acs-site/README.md` first. The `acs-site` plugin already exists in this repo, with sections for no-cache booking pages, `[acs_from_price]`, the pet-fee estimate, per-home times, error messages, GA4 events and schema. Add this work to it as new sections, and don't duplicate what's already there.
- The WPvivid staging copy was broken in the last session. Get staging working first, by recreating it in WPvivid → Staging if the copy failed. If you can't, stop and tell Andrew. Don't build on live.

## Ground rules
- Use Claude in Chrome (`claude --chrome`). Andrew is logged into wp-admin; never log in or type passwords yourself.
- **WPvivid backup (Database + Files) first.** Build and test on a **WPvivid staging copy**, show Andrew the result, and push to live only after he says yes.
- **Never edit MotoPress or any other plugin's files.** All code goes in the site plugin `wp-content/plugins/acs-site/acs-site.php` ("ACS Site Customizations"). Use MPHB hooks/filters, or template overrides copied into the child theme. If you find existing hand edits inside the MotoPress plugin (the custom city search is known to be one), don't build on top of them. Move that logic into the site plugin as part of this job, or tell Andrew it has to happen first.
- **Display only:** nothing here may change what a guest is charged. Every checkout total must match, to the cent, what it was before your change.
- Flush the GoDaddy cache after changes and verify logged-out with `?cb=<timestamp>`. The checkout, booking-confirmation **and search-results** pages must not be served from cache (a cached nonce on results would break Book Now).
- Log progress to `website-fix-log.md`, and commit and push the repo changes when done. Be lean: send mechanical test sweeps to a cheaper model/subagent, and keep code and judgment in the main session.

## How pricing works today (read before building A)
- Each of the 11 MPHB rates (IDs 1865–1874, 1893) has season rows (Weekends Fri–Sat, ID 2836; All Season, ID 1862). Each row has **price periods 1 / 7 / 28 nights**:
  - 1-night price = base rate
  - 7-night price = 90% of base (weekly discount, 10%)
  - 28-night price = 80% of base (monthly discount, 20%)
- MPHB picks the period by **total stay length** and simply charges the lower nightly number. It has no idea a "discount" exists, which is why checkout shows no savings. Example: 7 nights in Fairbanks shows $112.50 weeknights instead of $125, with nothing to say why.
- DuPont (1873) and Unit 2 (1868) have no weekend row. Cleaning fees and taxes are separate lines and are **not** discounted.

---

## A. Show the discount at checkout

**What the guest should see on `/booking-confirmation/` (MPHB checkout), for any stay of 7+ nights:**

1. A clear badge above the price breakdown:
   - 7–27 nights: **"✓ Weekly discount applied: 10% off every night"**
   - 28+ nights: **"✓ Monthly discount applied: 20% off every night"**
2. In the per-night list, each night shows the base price crossed out, then the discounted price: <s>$125.00</s> **$112.50**. Weekend nights use the weekend base (<s>$160</s> **$144**).
3. In the totals block, above the **Accommodation Subtotal**:
   - "Nightly rate before discount: $X"
   - "Weekly discount (10%): −$Y" (styled in the site's accent/green)
   - Accommodation Subtotal (unchanged, the real number)

   Then cleaning fee, taxes, coupon (if used) and Total as today.
4. Near the Total, a savings line: **"You're saving $Y with your weekly discount."** If the WELCOMEBACK coupon (or any coupon) is also used, show it as its own line as MPHB does, and make the savings line add both.

Stays under 7 nights look exactly as they do today.

**How to build it:**
- Work out the undiscounted price for each night by reading that date's season row **1-night** price from the rate, and compare it to the price MPHB actually charged for that night.
- Derive the discount percentage from the rate data (7-night price ÷ 1-night price). Don't hard-code 10/20, so the label stays right if Andrew changes the percentages.
- Hook into MPHB's price-breakdown output. Find the right filter or template in the installed MPHB version (e.g. the price-breakdown template under `templates/`, overridden in the child theme, or an MPHB filter on the breakdown data). Checkout recalculates the breakdown by AJAX when guests change adults/children/services/coupon, so the display must survive those re-renders (server-side is preferred over DOM patching).
- Apply the same crossed-out/discount display to:
  - the MPHB booking confirmation email price breakdown
  - the guest's "My booking" view, if one exists
- Keep it readable on mobile and accessible: add a screen-reader label on crossed-out prices, e.g. "was $125.00".

**Also (nice to have, same logic):**
- When a guest checks availability on a listing page for 7+ nights, show "Weekly discount applied: X% off" and the discounted total.
- On search results with dates set, show the per-night price with the base crossed out when the searched stay is 7+ nights.

---

## B. "Book Now" on filtered results goes straight to checkout

**The bug:**
1. A guest searches from the Home page main search or the Listings page search (city + check-in/out + guests).
2. The results page shows only available homes, with prices.
3. Clicking **Book Now** on a result goes back to the property page, and the guest has to re-enter their dates.

That's a step backwards and loses bookings.

**Required behavior, for all 11 listings:**
- When the results page was reached **with dates**, Book Now takes the guest straight to MPHB checkout (`/booking-confirmation/`), with that accommodation, check-in, check-out and guest count already filled in. That's the same state as clicking "Confirm Reservation" on the listing page after a successful availability check.
- Checkout expects a POST with:
  - `mphb_room_type_id`
  - `mphb_check_in_date` / `mphb_check_out_date` (Y-m-d)
  - `mphb_rooms_details[<room_type_id>]=1`
  - `mphb_is_direct_booking=1`
  - `mphb-checkout-nonce`
  - adults/children if the search captured them

  Render Book Now as a small form/button that submits exactly that, with a fresh nonce. Confirm the exact field names against the installed MPHB version's own booking form.
- Keep a separate **"View details"** link on each result, going to the property page with the dates carried along (query args the MPHB booking form reads, so the dates come prefilled there too).
- When there are **no dates** (plain browsing, Home featured cards), Book Now keeps going to the property page as it does today.
- If the home has become unavailable or the stay breaks a rule (e.g. the 3-night minimum), don't dump the guest on an error. Send them to the property page with dates prefilled and a clear message ("Those dates just became unavailable. Pick new dates or see other homes").
- Preserve the search state: the Back button from checkout returns to the same filtered results, not an empty search.

---

## Test matrix (staging, then live)
Run every case with checkout quotes only. **Never complete a real booking or enter payment details.** Pass criteria:
- Total matches a quote taken before your change.
- The discount display appears only when it should.
- The math on screen adds up.

| Entry point | Stays to test |
|---|---|
| Home main search → results → Book Now | 3 nights (no discount), 7 nights incl. a Fri/Sat (weekly), 30 nights (monthly) |
| Listings page search → results → Book Now | same |
| City filter only, no dates → Book Now | goes to property page as today |
| Listing page availability → Confirm Reservation | 7 and 30 nights show the discount |

- Cover **all 11 listings** at least once. Include Fairbanks (3-night minimum; Airbnb blocks dates from Jan 25, 2027), DuPont and Unit 2 (flat rate, no weekend row), and the combo listings (Duplex, 2 Apts, 4 Apts).
- Also test: adding the WELCOMEBACK coupon if it exists; changing the guest count on checkout (AJAX re-render keeps the display); mobile width; logged-out; the confirmation email preview.

## Deliver to Andrew
- Before/after screenshots of checkout for a 7-night and a 30-night stay.
- The test matrix results.
- The list of files added/changed in the site plugin or child theme, and the one-step rollback (deactivate the site-plugin section, or restore the backup).
- Then ask for the go-ahead to push to live.
