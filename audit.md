# Aurora & Cedar Stays — Website QC, Conversion, SEO, and Marketing-Readiness Audit

Audit date: September 28, 2026 (Alaska Daylight Time)  
Site audited: <https://www.auroraandcedarstays.com>  
Mode: public, read-only audit; no administrative access or website changes  
Test viewports: 390×844, 768×1024, 1366×768, and 1440×900

## 1. Executive summary

Aurora & Cedar Stays has a credible foundation: attractive property photography, a clear direct-booking proposition, a compelling military-owner story, useful Fairbanks winter guidance, an extended-stay page that names several valuable audiences, and a same-domain MotoPress/Stripe booking stack. The current site is not ready for paid traffic or Google Vacation Rentals, however, because the visible booking path does not reliably carry a qualified guest from search to checkout.

The highest-impact defect is reproducible. A homepage search for November 2–5, 2026 returned one available Fairbanks stay at **$375 total**. The visible **Book Now** link sent the visitor to the property's dateless page, where the displayed rate changed to **$410/night** and the dates and guest count were empty. Selecting those dates again in the property availability widget produced **“An error has occurred, please try again later.”** A separate search for **30 guests** still returned the Fairbanks unit even though the direct-site card says four guests and the description says up to five. These defects create booking abandonment, price distrust, and a serious risk of misleading ad or Google Vacation Rentals traffic.

The website also presents three incompatible price contexts. The homepage cards showed $360/$130/$155 for its first three properties, the Listings page showed $504/$147/$196 for those same properties, and the property pages displayed a third set of nightly prices. Fairbanks showed $213/night on Listings, $410/night on its property page, and $375 total for a three-night search. Even if the numbers represent different pricing rules, their undated presentation makes them look contradictory.

Direct-booking readiness: **1.5/5**. Extended-stay lead readiness: **2.5/5**. Organic-search readiness: **2/5**. Paid-search readiness: **1/5**. The site should not receive material paid traffic until the booking handoff, occupancy validation, price presentation, form routing, and attribution are verified on staging and production.

No mixed-content warning or broken public page load was observed. The primary risks are functional, content, trust, accessibility, attribution, and index quality—not a confirmed security compromise.

## 2. Coverage summary

### Audit scope and counts

| Measure | Result |
|---|---:|
| Public URLs discovered and loaded | 69/69 |
| Core/content pages | 13 |
| Canonical property pages | 11 |
| Accommodation archive pages | 2 |
| Booking/search/account system pages | 9 |
| Accommodation redirect aliases | 11 |
| Amenity archive pages, including pagination | 18 |
| City archive pages | 4 |
| Author archives | 1 |
| Additional observed internal base destinations | 3/3 loaded (`/listings`, `/accommodations/page/1/`, `/wp-login.php`) |
| Interactive element instances inventoried | 2,412 |
| Link instances | 2,263 |
| Form/control instances | 149 |
| Unique href values | 235 |
| Internal unique base destinations | 72/72 resolved |
| External URL instances | 211, representing 4 unique destinations |
| Email-link instances | 73, representing 3 addresses |
| Telephone-link instances | 71, representing 2 formats of the same number |
| PDF-link instances | 3, representing 1 PDF |
| Forms found | 40, including booking, search, login, and lead forms |
| Images observed | 1,770 DOM instances |
| Empty image alt attributes | 165 instances |
| GUID-like/non-descriptive image alt values | 396 instances |
| Interactive elements with no extracted accessible label | 1,283 instances |
| Pages missing meta descriptions | 69/69 |
| Pages with detected JSON-LD structured data | 0/69 |
| Public contact/inquiry forms submitted | 0; two authorized attempts were blocked by required phone fields |
| Booking path families tested | 3: homepage search, property direct widget, checkout/payment page |

Counts include repeated global components and Swiper clones. Findings are deduplicated by root cause below.

### Status summary

| Test layer | Passed | Failed | Warning | Unable to test safely |
|---|---:|---:|---:|---:|
| Public page loads | 69 | 0 | 0 | 0 |
| Internal base destinations | 72 | 0 | 0 | 0 |
| Unique external destinations | 4 reachable | 0 | 2 identity-limited shells (Airbnb, TikTok) | 0 |
| PDF destinations | 1 | 0 | 0 | 0 |
| Responsive viewport checks | 3 | 0 | 1 | 0 |
| Booking/availability workflow tests | 2 partial | 3 | 4 | 1 final transaction |
| Public lead-form tests | 0 | 0 | 2 blocked by required phone | 2 submissions |
| FAQ control/content checks | 9 | 1 wrong answer | 0 | 0 |

“Failed” booking tests are: selected state lost by the visible Book Now link, property availability submission returning a generic error, and maximum-occupancy filtering accepting 30 guests for Fairbanks. “Partial pass” means homepage search returned results and the checkout page rendered; neither proves reservation creation or payment.

### Deliberately skipped actions

- No final checkout **Book Now**, payment, confirmation, reserve, or terms acceptance was clicked.
- No payment card, billing address, phone number, government identifier, employer, or reservation number was invented or entered.
- No WordPress, GoDaddy, email, analytics, Stripe, PMS, OTA, or social account login was attempted.
- The WordPress login page was only loaded to verify the public destination; the form was not used.
- `mailto:` and `tel:` href syntax was validated, but 144 protocol-link instances were not activated because that would leave the browser and does not validate delivery or call completion.
- No newsletter or marketing opt-in was submitted; none was found.
- Payment authorization, reservation confirmation, inventory release/hold behavior, refund execution, and acknowledgement-email delivery remain untested.

## 3. Top 10 recommended changes

1. **Repair the booking state handoff.** Preserve property, dates, guests, pets, rate, and source from homepage search through the visible result CTA and checkout; make the property widget submit valid normalized dates without a generic error.
2. **Enforce occupancy and stay rules before results.** A 30-guest search must not return a four/five-person unit. Explain minimum-stay conflicts instead of returning an undifferentiated “Nothing found.”
3. **Create one authoritative price source.** Replace undated static “nightly” prices with live “from” pricing or remove them; show rate, cleaning, taxes, refundable/nonrefundable status, deposits, and mandatory pet charges consistently.
4. **Complete and reconcile policies.** Remove every bracketed placeholder, resolve the pet-policy variables, state when pet charges enter the total, and align cancellation, deposit, check-in/out, occupancy, visitor, smoking, party, child, and extension terms.
5. **Make the lead forms testable and lower-friction.** Make phone optional or explain why it is required; add an explicit subject/source field, reliable success state, routing owner, acknowledgement, spam protection, and event tracking.
6. **Install a minimum viable measurement stack before advertising.** Track property views, searches, result selections, checkout starts, payment-page views, confirmed reservations, qualified extended-stay leads, and phone/email clicks with source/medium/campaign persistence.
7. **Correct factual and cross-channel inconsistencies.** Replace “Puyallup light rail” with “Puyallup Sounder commuter rail,” verify the Tacoma ZIP code, and reconcile DuPont capacity and check-in/out facts across the direct site, Google, Vrbo/Expedia, Airbnb, Booking.com, and Furnished Finder.
8. **Unify the header and direct-booking path.** Use one header/footer template everywhere, expose Monthly Stays and a prominent booking action on every property page, and provide an always-available “edit search” option.
9. **Clean the index and implement search fundamentals.** Noindex or remove system, account, author, thin amenity, and confirmation/status pages as appropriate; add differentiated titles, descriptions, H1s, canonicals, social metadata, and valid structured data.
10. **Fix accessibility and responsive defects.** Label icon links and controls, write meaningful photo alt text, enlarge 6×6 gallery dots and 25×25 arrows, correct heading hierarchy, remove the 33 px tablet overflow, and test keyboard/focus/error behavior with assistive technology.

## 4. Link and control inventory

This compact ledger groups identical repeated components while preserving instance counts and affected areas. Every link instance's href and target behavior was extracted; every internal base destination was loaded. Repeated components were manually exercised on each distinct template.

| Component or control | Instances/scope | Intended action | Observed result | Tab behavior | Status |
|---|---|---|---|---|---|
| Skip to content | All templates | Jump to `#content` | Target present on audited templates | Same tab | Pass |
| Header logo | All templates | Home | Home loaded | Same tab | Pass; accessible name often empty |
| Desktop navigation | Core, property, policy, archive, system templates | Home/Listings/Monthly/FAQ/About/Contact | Destinations load | Same tab | Warning: Monthly Stays absent on older templates |
| Mobile Menu | 390 and 768 widths | Open off-canvas navigation | Opens after transition; all six newer-template links work | Same tab | Pass |
| Header Book Now | Home/newer templates | Listings | Loads Listings | Same tab | Warning: absent on property/mobile older templates |
| Homepage property cards | 3 cards | Property detail | Correct property loads | Same tab | Warning: card prices conflict with other surfaces |
| Listings property cards | 11 cards | Property detail | Correct property loads | Same tab | Pass destination; warning on prices/facts |
| Homepage availability form | 1 | Search dates/city/guests/amenities/pets | Valid search returns results | Same tab | Warning: past dates selectable; typed dates rejected |
| Search Availability page form | 1 | Date/guest search | Controls render; guests list 1–30 | Same tab | Warning: permits capacity-mismatched searches |
| Search-result Book Now | Dynamic result | Continue selected stay | Redirects to property page and drops dates/guest/total | Same tab | **Fail** |
| Search-result hidden Reserve/Confirm controls | Dynamic result | Checkout submission | Zero-size/not visible; not forced | Same tab | Unable—not publicly actionable |
| Property galleries | 11; 132 slide dots and 22 arrows | Navigate images | Slides and controls present; representative arrow/dot behavior works | In-page | Pass function; accessibility warning |
| Property FAQ accordions | 44 | Expand property answers | Panels and answer text exist; representative toggles work | In-page | Pass |
| Main FAQ accordions | 10 | Expand general answers | Controls work | In-page | **Fail content:** Wi-Fi/kitchen answer repeats parking answer |
| Property availability forms | 11 | Select dates and continue | All reveal after scroll/animation; Fairbanks submission with valid dates returns generic error | Same page/AJAX | **Fail** repeated widget |
| Contact form | 1 | Send general inquiry | Native validation works; required phone blocks authorized test | Same page | Warning/unable to submit |
| Monthly-stay form | 1 | Request quote | Required-field validation works; required phone blocks authorized test | Same page | Warning/unable to submit |
| Checkout form | 1 | Enter guest/contact/card details and book | Renders at desktop/mobile; Stripe frame loads; final Book Now disabled until completion | Same tab | Partial pass; final transaction not tested |
| Footer quick/useful links | All templates | Core/policy pages | Destinations load | Same tab | Pass; templates inconsistent |
| Footer phone | 71 instances, 2 encodings | Call +1 (205) 341-7045 | Valid `tel:` syntax | External protocol | Syntax pass; not activated |
| Footer/contact email | 73 instances, 3 addresses | Compose email | Valid `mailto:` syntax | External protocol | Syntax pass; delivery untested |
| Social links | 211 instances, 4 external URLs including Airbnb | Open public profile | Facebook/Instagram identify the brand; Airbnb/TikTok reach generic shell content | New tab | Pass destination; identity warning |
| Rosella guide links | 3 | Open/download PDF | PDF URL loads | One new tab, two same tab | Pass |
| Pagination | `/accommodations/` and seven amenity archives | Page 1/2 | Page 2 loads; `/page/1/` redirects to archive root | Same tab | Pass |
| Booking status/account links | System pages | Status/login functions | Public pages load | Same tab | Warning: indexable system/account pages |
| Copyright/logo `#` links | Global footer | No clear action | Reload/current-page hash only | Same tab | Warning: non-action links |

External destination details:

- Airbnb profile URL loads an Airbnb public shell, but the profile identity was not visible without further interaction.
- Facebook redirects to “Aurora and Cedar Stays | Fort Lewis WA.”
- Instagram resolves to `@auroraandcedarstays` and showed a sparse profile.
- TikTok resolves to the intended handle but only a generic shell was visible.
- The Rosella Good Neighbor Guide PDF is reachable at its published URL.

## 5. Contact-form submission log

No form submission occurred. Both authorized attempts stopped at a mandatory phone field, in accordance with the instruction not to invent a number. The timestamps below are the recorded page-visit/test-window start times; a submission timestamp does not exist.

| Test ID | Page and purpose | Test window (AKDT) | Fields shown | Values entered | Validation/result | Confirmation | Expected email |
|---|---|---|---|---|---|---|---|
| ACS-QA-CONTACT-001 | `/contact/` — general contact | 2026-09-28 21:14:59 | Name*, email*, phone*, message; no subject field | Authorized name, email, and exact QA message; phone blank | Blank submit first focuses name; after safe fields were populated, Send focuses invalid required phone; no network success state | None | None should have been sent |
| ACS-QA-MONTHLY-002 | `/month-to-month-furnished-rentals/` — monthly quote | 2026-09-28 21:15:34 | Name*, email*, phone*, guests*, city*, move-in*, move-out*, reason*, pets, message | Authorized name/email/message; 2 guests; Lakewood/DuPont/Tacoma; 2026-11-01 to 2026-12-01; Military PCS; phone blank | Request Quote focuses invalid required phone; no success state | None | None should have been sent |

The requested subject **“Website QA Test — Please Disregard”** could not be entered because neither public form exposes a subject field. No marketing consent was displayed or accepted.

## 6. Email-delivery verification checklist

For this audit run, the expected inbox result is **no message**, because both forms were blocked before submission.

- [ ] Confirm no message with `ACS-QA-CONTACT-001` arrived; an arrival would indicate unexpected background submission.
- [ ] Confirm no message with `ACS-QA-MONTHLY-002` arrived.
- [ ] After the phone requirement is removed or a real authorized number is supplied, create new test IDs rather than reusing these IDs.
- [ ] Confirm each new test reaches the intended inbox and not an obsolete alias.
- [ ] Confirm the test ID survives in the body and/or subject.
- [ ] Confirm sender display, From, and Reply-To make a reply go to `Vivian.c.lekowski@gmail.com`.
- [ ] Confirm field labels and line breaks render correctly on desktop and mobile email clients.
- [ ] Check spam/junk and quarantine.
- [ ] Confirm any acknowledgement reaches `Vivian.c.lekowski@gmail.com` and does not subscribe the address to marketing.
- [ ] Confirm the Contact and Monthly forms route separately if different teams/workflows are intended.

## 7. Booking and checkout log

| Path | Criteria | Result and prices | Steps | Mobile/desktop behavior | Exact safe stopping point | Status |
|---|---|---|---:|---|---|---|
| Homepage search → results | All cities; Nov 2–5, 2026; 1 guest | 1 Fairbanks stay; **$375 total** | 1 | Search form fits 390/1366/1440; 768 has page-wide horizontal scroll | Results page before Book Now | Partial pass |
| Homepage search → visible Book Now | Same | Lands on Fairbanks property; criteria empty; **$410/night** | 2 | Same behavior at desktop; property page responsive | Dateless property page | **Fail: state and price context lost** |
| Fairbanks property availability | Nov 2–5, 2026 | “An error has occurred, please try again later.” Hidden named date values remain empty while visible date fields populate | 1 AJAX attempt | Form reveals after scrolling/animation; responsive | Error on property page | **Fail** |
| Maximum occupancy | Nov 2–5, 2026; **30 guests** | Still returns Fairbanks at $375 total although direct content says four/five guests | 1 | Result responsive | Results page | **Fail** |
| One-night stay | Nov 2–3, 2026; 1 guest | “Nothing found. Please try again with different search parameters.” | 1 | No edit form in result body | Empty result | Warning: minimum-stay cause not explained |
| Past-date validation | Sep 27–30, 2026 | Calendar allowed a past check-in; server then rejected it as earlier than today | 1 | Calendar interaction works but error page is a dead end | Error result | Warning |
| Typed-date entry | Jan 1–3, 2027 | Visible text accepted, normalized hidden values remained empty; server said both dates invalid | 1 | Keyboard/manual entry unreliable | Validation result | Warning/accessibility risk |
| Browser Back | From property after result CTA | Returns to prior result with query and summary intact | 1 | Passed | Results restored | Pass |
| Checkout/payment page | Session state: Fairbanks, Oct 1–4, 2026 | Cleaning fee $90; subtotal excl. tax $535; taxes $35.60; total $570.60; Stripe card frame | Checkout rendered | No horizontal overflow at 390; 279 px-wide fields; long single-column form | Before guest/contact/card entry and final **Book Now** | Partial pass; no transaction |

Checkout required: guest count, first/last name, email, phone, country, card details, and terms acceptance. No contact or payment data was entered. No abandoned-checkout email should have been triggered because the checkout did not receive an email address. No evidence of an inventory hold was visible, but hold behavior requires PMS/admin confirmation.

The booking engine is publicly identifiable as MotoPress Hotel Booking 4.6.0 on the same domain; Stripe is the visible card processor. Cross-domain attribution is therefore not required for the site-to-booking transition, but Stripe iframe behavior and server-side confirmed-booking attribution still require implementation and validation.

## 8. Guest and lead journeys

| Journey | Current path | Strongest point | Weakest point | Recommended target path |
|---|---|---|---|---|
| Short-stay direct booking | Home search → result → Book Now → property | Live search can return a dated total | Dates/guests/price are dropped; property date form errors | Search → preserved property/date/guest result → itemized checkout → confirmation |
| 30+ day stay | Monthly Stays → quote form | Audiences, furnished basics, 27+ screening are stated | Required phone prevents email-only lead; market/property choices and price expectations are thin | Audience/market selector → relevant properties and monthly expectations → qualified quote form |
| Military/JBLM | Home or generic property → description/FAQ | Owner is active-duty Army; JBLM is mentioned repeatedly | No focused PCS/TDY path, commute-by-gate detail, lease/reimbursement support, or proof near CTA | `/dupont-jblm-housing` → property comparison → live short-stay search or 30+ day quote |
| Traveling healthcare | Monthly Stays | Travel nurses are explicitly named | No hospital/medical-area commute context, assignment-length guidance, invoice/extension detail, or relevant property grouping | Monthly hub healthcare section → market/property fit → quote |
| Corporate/relocation/insurance | Monthly Stays → quote | Relocation and insurance audiences are named | No billing/invoice, documentation, extension, deposit, household-size, pets, or response-time detail | Monthly hub qualification → corporate/insurance requirements → quote with routing |
| OTA/Furnished Finder referral | External listing/search → direct site property | Direct site has owner story and expanded content | Property naming/facts are inconsistent across channels; direct booking cannot complete | Exact property landing page with matching facts, rate context, policies, and preserved dates |
| Google Ads visitor | Likely homepage today | Clear visual brand and booking search | No query-to-page message match, broken booking transition, no detected conversion stack | Intent-specific landing page → live availability or qualified lead → measured outcome |

Strongest journey: a researcher reading the Fairbanks page receives unusually helpful seasonal, wildlife, stairs, shared-space, sleeping, and cold-weather context. Weakest journey: a high-intent dated visitor who clicks the search result's Book Now control.

## 9. Market and audience coverage

| Market/audience | Current evidence | What is missing | Readiness |
|---|---|---|---:|
| Puyallup | Five property/group listings, fairgrounds and JBLM references | Search-focused market page, correct transit language, neighborhood/commute map, stay-length clarity | 2/5 |
| Tacoma/Parkland | Three related 129th St units, PLU/JBLM references | Parkland vs Tacoma clarity, correct ZIP, gate/commute distinctions, property comparison | 2/5 |
| DuPont/JBLM | One large home, trail/JBLM context | PCS/TDY documentation, gate access/commute, short vs monthly routing, fact consistency | 2/5 |
| Fairbanks | Detailed property copy, Fort Wainwright and winter context | Dedicated market page, monthly/corporate/medical positioning, corrected title/copy, concise comparison proof | 3/5 |
| Monthly furnished housing | Dedicated page; nurses, PCS, relocation, insurance, kitchens/Wi-Fi | Pricing range/quote expectations, Puyallup option, lease/deposit/utilities/invoicing/extension process, response SLA | 2.5/5 |
| Military PCS/TDY | Repeated JBLM references, owner credibility, Fort Wainwright content | Dedicated qualification path, orders/timing needs, furnished household details, reimbursement/invoice support | 2.5/5 |
| Healthcare | Named on monthly page | Hospitals/commutes, shift-worker considerations, assignment lengths, quiet/workspace proof | 1.5/5 |
| Corporate/project | Named generally | Billing, employer approval packet, invoicing, occupancy/visitor rules, renewal terms | 1.5/5 |
| Insurance displacement | Named generally | ALE/direct-bill capabilities, adjuster documentation, household/pet matching, extension workflow | 1.5/5 |
| Relocation | Named generally | School/commute orientation, flexible start dates, extension/termination process, property comparison | 1.5/5 |

The five Puyallup descriptions that call Puyallup Station “light rail” should be corrected. Sound Transit's current station and route documentation identifies it as an S Line **Sounder commuter-rail** station, not Link light rail: [Puyallup Station](https://www.soundtransit.org/ride-with-us/stops-stations/puyallup-station) and [Sounder stations](https://www.soundtransit.org/ride-with-us/stations/sounder-train-stations).

## 10. Page-by-page findings

### Homepage — `/`

- **Audience:** first-time short-stay visitors and general referrals.
- **Works:** current version says “Book Direct and Save,” names Washington/Alaska use cases, offers a live search, shows three property cards, and uses attributed Airbnb review content rather than the generic testimonials seen in an earlier cached/template response.
- **Problems:** no meta description, social metadata, or structured data; static card prices conflict with Listings/property/search; dates can be past; no visible direct-booking benefit proof beyond the headline; testimonial/social proof is far from the booking decision.
- **Change:** show live dated “from” prices or remove undated prices; place a concise guarantee/benefit/policy strip beside the search; link monthly users to a separate path; fire measured search events.

### Listings — `/listings/`

- **Audience:** visitors comparing all 11 inventory options.
- **Works:** complete card set with beds/bedrooms/baths/guests, addresses, and direct property links.
- **Problems:** older header omits Monthly Stays; card rates conflict with homepage and detail pages; Tacoma ZIP inconsistency; no sort/filter comparison for market, occupancy, stay length, accessibility, pets, or audience; generic “Book Now” opens a dateless page.
- **Change:** use one authoritative data source and add market/stay/audience filters, concise differentiators, live availability, and a comparison-friendly card design.

### Monthly & Extended Stays — `/month-to-month-furnished-rentals/`

- **Audience:** travel nurses, PCS, relocation, insurance, and other 27+ night leads.
- **Works:** clearly states furnished basics and screening concepts; provides a dedicated inquiry form.
- **Problems:** Puyallup is absent from the location choices; pricing/utilities/deposit/lease/extension/invoice expectations are missing; mandatory phone blocks an email-only lead and prevented this authorized submission; no acknowledgement expectation or response SLA is stated.
- **Change:** make phone optional or explain its necessity; add property/market choices, budget range, household/pet/parking needs, employer/insurer support, timeline, and response expectation.

### Contact — `/contact/`

- **Audience:** general questions and support.
- **Works:** phone, email, and social destinations are visible; 390 px form controls fit and native required validation appears.
- **Problems:** no subject, category, expected response time, privacy microcopy, or success-state evidence; phone is required; routing could not be verified.
- **Change:** category/source dropdown, optional phone, explicit consent/privacy note, reliable confirmation, acknowledgement, and tracked submission.

### FAQ — `/faq/`

- **Audience:** booking objections and policy questions.
- **Works:** ten relevant accordion questions; booking, payment, confirmation, changes, deposits, pets, parking, check-in/out, and long-term topics are covered.
- **Confirmed defect:** “Do you provide WiFi and kitchen facilities?” repeats the parking answer.
- **Change:** correct that answer; add total-price timing, booking steps, cancellation summary, pet-fee timing, monthly terms, accessibility, visitors/parties/smoking/children, and a measured CTA after relevant answers. Add FAQ schema only for visible, accurate content and only if consistent with Google guidance.

### About — `/about/`

- **Audience:** trust-seeking direct bookers and referral visitors.
- **Works:** Andrew's active-duty Army/Apache-pilot story and Superhost/Premier Host experience are strong differentiators; Andrew and Vivian contact information is visible.
- **Problems:** proof is isolated from price/checkout decisions; no linked/verified Vrbo proof; generic site metadata.
- **Change:** reuse concise owner/hosting proof near property and checkout CTAs, with accurate profile/review links and no unverifiable badges.

### Policy pages

Affected: `/privacy-policy/`, `/cookie-policy/`, `/terms-of-service/`, `/accessibility-statement/`, `/refund-cancellation-policy/`, `/pet-policy/`.

- **Works:** all key policy destinations exist and load; cancellation windows are at least publicly stated.
- **Problems:** five documents show literal bracketed dates such as `Effective Date: [June 9, 2026]`; the pet policy includes unresolved text such as `[dogs / cats / dogs and cats]`, `[2] pets`, `[pool area / gym / clubhouse / lobby seating]`, and “pets are welcome at” with no completed object. The Terms say charges are disclosed at checkout, while property copy says pet fees are requested after confirmation. Policy pages lack H1s and metadata.
- **Change:** legal/content review, remove placeholders, align booking-engine behavior, add document owner/version/effective date, and make high-impact terms visible before checkout. This audit does not assess legal compliance.

### Property-page template — all 11 accommodations

What works across the template: image galleries, addresses, property descriptions, amenity sections, four property FAQs, and an availability widget. What fails across the template: no H1, older navigation, static/contradictory price display, unlabeled media controls, very late booking form placement on mobile/tablet, and the repeated date-normalization/error workflow. The widget is initially `visibility:hidden` because of an Elementor entrance animation but reveals after scrolling; that animation state is not the underlying failure.

| Property | Displayed detail rate | Useful differentiation | Confirmed/missing information |
|---|---:|---|---|
| Huge Private 3BR near PLU/JBLM | $241/night | 3BR, fenced yard, PLU/JBLM | No explicit capacity at decision point; pet charge after confirmation; “15 minutes from all gates” needs substantiation |
| New Private 2/1 near JBLM/PLU | $213/night | Walkable PLU conveniences | Address shows ZIP 98344 while the same-address duplex shows 98444; verify and correct |
| Entire Duplex — 2 Units | $213/night | Two kitchens/5BR/6 beds | Detail rate implausibly below/same as single units; explicit max occupancy and allocation rules missing |
| Chic Spacious Puyallup | $226/night | 2BR, yard, fairgrounds | Calls Sounder “light rail”; no minimum stay/check-in/out/payment expectations |
| Great Location Puyallup Unit 2 | $203/night | 2BR/private backyard | Copy is nearly identical to Chic; calls Sounder “light rail”; weak unit differentiation |
| Spacious Private Puyallup upper | $274/night | Workspace, patio/fire pit | Calls Sounder “light rail”; accessibility implications of “Upper Level” not explained |
| Trendy Basement Studio | $235/night | King/queen, noise disclosure | Calls Sounder “light rail”; card says 6 guests but FAQ only says “multiple”; coin laundry terms missing |
| 2 Spacious Apartments | $520/night | 4BR/2 kitchens/one-step entry | Exact max occupancy and which beds/parking spaces are included missing |
| 4 Spacious Apartments | $1,049/night | 7BR/4BA group use | Card/detail inventory needs exact unit allocation; calls Sounder “light rail”; event/party/visitor limits missing |
| DuPont 4BR near JBLM | $410/night | 4BR, fenced yard, trails, whirlpool | Direct card says 10 guests; public Google data says 8. Direct FAQ says 4 pm/11 am globally; Vrbo says 5 pm/10 am. Reconcile feeds |
| Fairbanks Cozy Aurora Retreat | $410/night | Strong cold-weather, wildlife, stairs, shared-space, sleeping detail | Listing card says 4 guests while copy permits 5; “Location Top Hightlights” typo; “Essentials” listed as not included; 116 eager image nodes |

Every property should add a standardized facts panel: stable property name/ID, verified occupancy and bed allocation, minimum/maximum stay, check-in/out, stairs/accessibility, parking, pets and all fees, Wi-Fi/workspace, laundry/kitchen, children/visitors/parties/smoking, cancellation/deposit/payment timing, support/check-in process, and monthly extension terms.

### Search, checkout, and system pages

Affected: `/search-availability/`, `/search-results/`, `/booking-confirmation/`, booking status children, `/booking-cancellation/`, and `/my-account/`.

- Search results have no embedded edit form and the primary visible Book Now link loses state.
- The checkout page itself is responsive and itemizes a cleaning fee and tax in the observed session, but a completed transaction was not authorized.
- Booking-confirmed/canceled/received/failed pages and My Account are publicly indexable (`max-image-preview:large`, no `noindex`) and present mostly boilerplate when opened out of context.
- My Account posts to the standard WordPress login endpoint; this is not inherently a vulnerability, but it is irrelevant to organic search.

### Rosella guide — `/rosella-guide/`

- **Works:** all three PDF links resolve; the guide is easy to open/download.
- **Risk/opportunity:** decide whether the guide and exact address are intended for public indexing or should be guest-only/noindex; ensure emergency/contact/house-rule content remains current.

### Archive and author pages

Affected: `/accommodations/` plus page 2, 18 amenity archive URLs, four city archives, 11 `/accommodation/...` aliases, and `/author/ch-samikamboh22gmail-com/`.

- Aliases redirect to canonical property URLs, which is good, but they remain listed in the sitemap.
- City/amenity pages are thin, repetitive, and indexable; seven amenity archives require a second page.
- The author archive title publicly exposes `Andrew@AuroraAndCedarStays.com` and has no useful content or canonical.
- Consolidate or noindex thin archives; remove system/redirect URLs from XML sitemap; replace city archives with genuinely useful market pages.

## 11. Landing-page recommendations

Build the smallest useful set below. Do not create separate thin pages for every audience/keyword until conversion and query evidence justify them.

| Page | Audience and search intent | Required content/proof | Primary action | Relevant properties/internal links | Channel |
|---|---|---|---|---|---|
| `/puyallup-tacoma-furnished-rentals` | Furnished rental Puyallup/Tacoma, fairgrounds, PLU, family/business | Market map; Puyallup vs Parkland/Tacoma sections; verified Sounder/drive context; property comparison; stay lengths; fees/policies; local proof and FAQs | Live availability for short stays; monthly quote secondary | Five Puyallup/group units and three 129th St units; link Listings, Monthly, policies | Organic + Search Ads |
| `/dupont-jblm-housing` | PCS, TDY, military family, temporary housing near JBLM | Gate/commute ranges with caveats; owner credibility; furnished household/parking/pets; orders/invoice/extension support; DuPont trail/neighborhood context; FAQs | Choose dates or 30+ day quote | DuPont 4BR plus relevant Tacoma/Puyallup alternatives; Monthly, About, policies | Organic + Search Ads + military groups |
| `/fairbanks-furnished-rentals` | Fairbanks furnished/monthly/corporate/Fort Wainwright | Concise market summary; winter logistics; Fort Wainwright/UAF/hospital/airport context; property facts; monthly process; seasonal FAQs | Live availability; monthly quote secondary | Fairbanks property, Monthly, Rosella guide only if relevant, policies | Organic + Search Ads |
| Upgrade existing `/month-to-month-furnished-rentals/` | Healthcare, corporate, insurance, relocation, military 27+ nights | Four audience sections with differentiated requirements; lease/deposit/utilities/payment/invoice/extension process; availability timeline; property/market match; proof; FAQs | Qualified request form | All market pages, relevant properties, About, policies | Organic + paid lead traffic |

Only after Search Console/ads/lead data shows distinct demand should separate `/travel-nurse-housing`, `/corporate-housing`, or `/insurance-relocation-housing` pages be created. Each would need unique operational proof—not swapped keywords.

## 12. Marketing-channel readiness

| Channel | Score | Why | Prerequisites |
|---|---:|---|---|
| Google Vacation Rentals/free booking links | **1/5** | MotoPress was detected, but MotoPress does not appear on Google's current published partner list; rate/occupancy/landing-state accuracy fails public tests | Confirm eligible connectivity partner; repair state preservation; stable IDs; accurate live inventory/rates/fees; property landing pages; policy/photo/feed reconciliation; conversion reporting |
| Google organic search | **2/5** | Good raw property/market material, but all 69 pages lack meta descriptions and detected schema; thin/indexable archives and missing H1s dilute quality | Index cleanup; market pages; property differentiation; metadata/schema/social cards; internal links; performance/accessibility |
| Google Search Ads | **1/5** | Homepage and search path cannot reliably complete a booking; no detected conversion stack; weak market message match | Fix funnel; build intent landing pages; GA4/Ads events; consent; negative-keyword plan; reservation/qualified-lead optimization |
| Furnished Finder traffic | **2/5** | Monthly page is relevant but phone-required form and missing monthly operational details cause friction; no public Furnished Finder link was discoverable | Consistent listing facts; market/property landing links; qualified monthly form; routing/SLA; provide owner listing URLs for reconciliation |
| OTA referral traffic | **2/5** | Direct site adds owner/property context, but facts, prices, and booking continuity are inconsistent | Channel fact sheet; exact property mapping; consistent photos/capacity/policies; direct booking reliability; comply with each platform's rules |
| Meta retargeting | **1/5** | No public Meta Pixel signal was detected; no consent control; booking outcome cannot be attributed | Consent design; pixel/CAPI if appropriate; property/search/lead/purchase audiences; exclusions for bookers/leads; privacy review |
| Organic social/housing groups | **2/5** | Clear audience story and monthly offer; social profiles are sparse and landing pages are generic | Market/audience pages, qualification content, trackable links, consistent profiles, group-specific non-spam messaging |
| Microsoft/Bing Ads | **1/5** | Same funnel, landing, and attribution limitations as Google Ads; no detected UET | Repair funnel, intent pages, UET/consent, offline/confirmed-booking import, query exclusions |

Google states that Vacation Rental booking links should land with the selected property, dates, and price preserved; the current visible path does not. Google also requires mandatory taxes and fees to be complete and accurate. See [Vacation rental referral experience policy](https://support.google.com/hotelprices/answer/10843498?hl=en), [Taxes and Fees Policy](https://support.google.com/hotelprices/answer/6064432?hl=en), and [Google's current vacation-rental partners](https://support.google.com/hotelprices/answer/11946834?hl=en). Administrative confirmation is still required because a separate PMS/channel manager may be connected behind the public site.

For paid search, sending all traffic to the homepage would waste spend for “JBLM PCS housing,” “Fairbanks monthly furnished rental,” “travel nurse housing,” and insurance-displacement queries. Suggested negative themes—only after query review—include apartment for sale, unfurnished, Section 8, roommate, jobs, free, campground, long-term lease when unavailable, and markets not served.

## 13. Master implementation backlog

| ID | Area | Exact problem/evidence | Recommended change | Category | Priority | Impact | Effort | Confidence | Likely owner | Verification criteria |
|---|---|---|---|---|---|---|---|---|---|---|
| ACS-001 | Search → property → checkout | Nov 2–5 search returns $375; visible Book Now drops state; property page shows $410/night and empty dates | Preserve query/state and route visible CTA directly to valid checkout; repair normalized date fields | Booking | Critical | Direct revenue | Large | High | MotoPress/custom booking code | Same criteria/property/total persist through checkout on all viewports |
| ACS-002 | Occupancy | 30-guest search returns Fairbanks unit advertised for 4–5 | Enforce capacity server-side and client-side; test adults/children/pets | Booking/QC | Critical | Prevents disputes/unsafe bookings | Medium | High | PMS/MotoPress | Over-capacity search returns no unit plus explanatory message |
| ACS-003 | Pricing | Homepage, Listings, property, and search show incompatible undated numbers | One rate source; dated total or honest “from”; itemize mandatory charges | Pricing/trust | Critical | Trust/revenue | Large | High | PMS + theme/content | Same itinerary yields consistent base/fees/tax/total everywhere |
| ACS-004 | Pet charges | $20/night or $399 monthly fee collected after confirmation; policy has placeholders | Complete pet policy and include mandatory pet charge before final total/confirmation | Policy/pricing | High | Disputes/GVR eligibility | Medium | High | PMS + content/legal | Pet itinerary shows exact fee before final booking and matching policy |
| ACS-005 | Policies | Bracketed dates and unresolved species/limit/common-area text | Replace placeholders; version and approve all policies | Legal/content QC | Critical | Disputes/trust | Small | High | Content/legal | No brackets/placeholders; terms match booking engine |
| ACS-006 | Property facts | Five Puyallup pages say “light rail”; Sound Transit identifies Sounder | Correct mode/name and verify distance/walk time | Accuracy/SEO | High | Expectation match | Small | High | Content | All affected pages say Sounder commuter rail with accurate context |
| ACS-007 | Address/channel facts | 324 129th St card ZIP 98344 vs same-address duplex 98444; DuPont occupancy/check-in/out differ publicly | Create verified property master sheet and sync every channel | Data/QC | Critical | Check-in/dispute risk | Medium | Medium | PMS/content/channel manager | Direct site and channel audit match on name/address/capacity/times |
| ACS-008 | Lead forms | Mandatory phone prevents authorized Contact and Monthly tests; no subject/routing proof | Make phone optional or explain; add category/source; confirmations and routing | Forms/conversion | High | More qualified leads | Medium | High | MetForm/Elementor/email | Both forms send once, confirm on-page, route correctly, acknowledge, track |
| ACS-009 | Measurement | No public GA4/GTM/Ads/Meta signal or business-event proof detected | Implement consent-aware event plan and server-confirmed booking signal | Tracking | High | Enables profitable media | Large | High | GTM/GA4/Ads/PMS | Debug evidence and platform records for every event in §16 |
| ACS-010 | Search UX | Past dates selectable; manual typing fails; empty results lack edit form/reason | Disable past dates, normalize accessible input, keep editable search and explain stay rules | Booking UX | High | Fewer abandonments | Medium | High | MotoPress/theme | Keyboard/mobile tests; invalid rules explained; criteria editable |
| ACS-011 | Navigation | Monthly Stays/Book Now vary across templates; property mobile header lacks booking CTA | One global header/footer and contextual sticky booking/monthly action | IA/conversion | High | Better discovery | Medium | High | Elementor Theme Builder | Identical nav on every template/view; active/focus states correct |
| ACS-012 | FAQ | Wi-Fi/kitchen answer repeats parking | Replace with accurate amenity answer and audit all copied FAQs | Content QC | High | Reduces uncertainty | Small | High | Content | Question displays correct answer in page/DOM/schema |
| ACS-013 | Property facts panels | Minimum/maximum stay, max occupancy, beds, policies, access, payment, extension often absent near CTA | Standard property facts component fed from master data | Content/conversion | High | Trust/fewer disputes | Large | High | Elementor/PMS/content | Each 11-page checklist is complete and consistent |
| ACS-014 | SEO metadata | 69/69 missing descriptions; 0/69 detected JSON-LD; OG/Twitter absent on tested home | Write differentiated metadata; valid property/breadcrumb/organization schema and social cards | SEO | High | Qualified discovery | Medium | High | SEO plugin/theme | Crawler validation, Rich Results testing, social preview checks |
| ACS-015 | Index control | Thin amenity/city pages, system/status/account/author pages indexable and in sitemap | Noindex/remove from sitemap; consolidate thin archives; retain useful canonicals | Technical SEO | High | Crawl/index quality | Medium | High | WordPress/SEO plugin | XML sitemap contains only intended canonicals; URL inspection confirms |
| ACS-016 | Author archive | Author URL/title exposes an email and no useful content/canonical | Disable/noindex author archive; use branded author display name if retained | Privacy/SEO | Medium | Reduces noise/exposure | Small | High | WordPress/SEO | Archive removed or noindex with no email in title/slug |
| ACS-017 | Accessibility labels | 1,283 unlabeled interactive instances; footer icons often empty; 165 empty and 396 GUID alts | Label controls; decorative alt=""; descriptive property-photo alt; name logo links | Accessibility | High | Usability/SEO | Large | High | Elementor/content | Keyboard + screen-reader spot check; automated scan materially improved |
| ACS-018 | Gallery targets | 6×6 dots and ~25×25 arrows on responsive property views | Minimum ~44×44 touch area, visible focus, descriptive status | Accessibility/mobile | Medium | Mobile usability | Small | High | Elementor/Swiper CSS | Measured targets and keyboard navigation pass |
| ACS-019 | Heading structure | Property pages lack H1; policies use H2; empty headings/H6-first patterns | One descriptive H1; logical hierarchy; remove empty headings | Accessibility/SEO | Medium | Clarity/indexing | Medium | High | Elementor/content | Outline review passes all key templates |
| ACS-020 | Tablet overflow | 768 viewport: client 753, scroll 786; footer inner/icon-list containers overflow | Correct footer widths/gaps; enforce responsive containment | Responsive QC | Medium | Tablet polish | Small | High | Elementor/CSS | No horizontal scroll at 768 on all templates |
| ACS-021 | Performance | Home loads 61 script elements; properties 62–116 image nodes, all 116 Fairbanks images eager/unset; only 2 use `srcset` | Remove unused add-ons/scripts, lazy-load gallery, responsive WebP/AVIF, preload only hero | Performance | Medium | Speed/conversion | Large | High | WordPress/plugins/CDN | Lighthouse/WebPageTest after staging; no offscreen eager gallery load |
| ACS-022 | Consent/privacy | GoDaddy signal scripts observed; no consent UI on 69 pages; privacy says analytics | Inventory cookies, implement jurisdiction-appropriate consent/control, align policy | Privacy/tracking | High | Trust/compliance risk | Medium | Medium | CMP/legal/tag manager | Pre-consent network audit and preference persistence verified |
| ACS-023 | Market landing content | City archives are thin; high-intent audience paths absent | Build the four differentiated pages in §11; no doorway copies | SEO/PPC/content | Medium | Qualified leads | Large | Medium | Content/SEO | Unique useful copy, proof, links, CTA, indexability, conversion events |
| ACS-024 | Trust near CTA | Owner/review proof and direct-booking benefits are remote from price/checkout | Add concise verified proof, secure-payment and support expectations near CTA | CRO/trust | Medium | Checkout confidence | Medium | Medium | Content/design | User test can identify host, support, policies, and direct benefit before booking |
| ACS-025 | Social/OTA consistency | Sparse social profiles; Google/Vrbo facts disagree; Airbnb/TikTok identity limited in browser | Channel audit and master property feed; link only verified profiles | Channel marketing | Medium | Referral trust | Medium | Medium | Channel manager/content | Quarterly property/channel matrix has no material discrepancies |
| ACS-026 | Fairbanks copy | “Location Top Hightlights,” awkward repetitions, “Essentials” not included, listing 4 vs copy 5 guests | Edit and reconcile while preserving useful winter/safety detail | Content QC | Medium | Expectations/SEO | Small | High | Content | Editorial checklist and capacity master data pass |
| ACS-027 | System state pages | Confirmation/canceled/failed pages are indexable and mostly boilerplate out of context | Noindex; meaningful contextual states; support/retry actions | Booking/SEO | Medium | Recovery/index quality | Medium | High | MotoPress/SEO/theme | Direct URL shows safe generic state; transaction states show correct next action |
| ACS-028 | Footer/current-page links | Copyright/logo `#` anchors do not perform a useful action | Use plain text or real home/legal link; keep accessible name | QC/accessibility | Low | Polish | Small | High | Elementor | No empty/non-action anchors in footer |

## 14. Quick wins

Each item should take less than roughly 30 minutes once the correct WordPress template is located:

- Correct the FAQ Wi-Fi/kitchen answer.
- Replace “Location Top Hightlights” with “Location Top Highlights.”
- Replace “Puyallup light rail station” with verified Sounder commuter-rail wording on five descriptions/FAQs.
- Verify and correct the 324 129th St S ZIP code.
- Remove bracket characters around approved policy effective dates.
- Remove/replace the most visible pet-policy placeholders immediately; unpublish the page if it cannot be made accurate safely.
- Add Monthly Stays to the older global header menu.
- Change footer copyright anchors from `#` to plain text or a meaningful destination.
- Add accessible names to Facebook/Instagram/TikTok icon links.
- Noindex the author archive and booking status/account pages after confirming no operational dependency.
- Add a clear “Edit dates and guests” link on search results.
- Add a short response-time statement above both lead forms.

## 15. Structural improvements

1. **Data layer:** create one property master record per accommodation with immutable ID, canonical name, address, market, occupancy, beds/baths, accessibility, policies, check-in/out, fees, photos, and channel mappings.
2. **Booking architecture:** repair MotoPress date normalization and make the public CTA submit the actual property/date/rate selection. Treat the checkout session as the source of truth.
3. **Information architecture:** one header/footer, four differentiated landing pages, an upgraded Listings comparison view, and a clear split between short stays and 27+/30+ inquiries.
4. **Policy architecture:** reusable policy summaries on property/checkout pages backed by approved full policies; no fee first disclosed after confirmation.
5. **Tracking architecture:** client-side intent events plus server/PMS-confirmed reservation and lead-quality outcomes; attribution persisted first-touch and last-touch.
6. **WordPress/plugin footprint:** consolidate Elementor add-ons and scripts, use responsive media, stage every theme/plugin change, and keep booking/payment changes isolated from content releases.
7. **Channel governance:** quarterly direct/OTA/Google/Furnished Finder matrix and a publish checklist that prevents capacity, rate, address, photo, and check-in/out drift.

## 16. Tracking plan

### Minimum events before paid advertising

| Event | Trigger | Required parameters | Conversion use |
|---|---|---|---|
| `view_property` | Canonical property page view | property_id, property_name, market, page_path, source/medium/campaign | Funnel diagnostic |
| `search_availability` | Successful search submit | market/city, check_in, check_out, nights, adults, children, pets, amenity filters | Intent diagnostic |
| `view_search_results` | Result/empty state renders | criteria, result_count, error/min_stay_reason | Funnel diagnostic |
| `select_property` | Visible result CTA | property_id, displayed_total, currency, criteria | Funnel diagnostic |
| `begin_checkout` | Valid selected stay enters checkout | property_id, dates, guests, rate, fees, taxes, total, currency | Primary micro-conversion |
| `view_payment` | Card/payment section becomes visible | property_id, total, currency; no card or PII | Micro-conversion |
| `purchase` / `reservation_confirmed` | Server/PMS-confirmed reservation only | booking_id, property_id, value, currency, nights, channel; no raw PII | Primary booking conversion |
| `generate_lead` | Server-confirmed Contact/Monthly delivery | form_id, market, reason, stay_length_band, qualified flag when known | Primary lead conversion |
| `tel_click` / `email_click` | Contact-link activation | placement, page_type, property_id if relevant | Lead diagnostic |
| `form_error` | Client/server validation error | form_id, field/error_code, step; never field values | Friction diagnostic |

### Attribution requirements

- GA4 plus Google Ads conversions, and Microsoft UET if Bing Ads is used; GTM is optional but useful for governance.
- Preserve `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `gclid`, `gbraid/wbraid`, `msclkid`, and Meta click IDs where legally appropriate.
- Persist first-touch and latest-touch values through the same-domain MotoPress checkout; do not send email, phone, names, addresses, or card data to analytics.
- Fire confirmed booking only from the success state backed by PMS/payment status, preferably server-side; deduplicate browser/server events by booking/event ID.
- Import qualified-lead and confirmed-booking outcomes to ad platforms. Optimize to **cost per confirmed booking** and **cost per qualified extended-stay lead**, not raw form starts or clicks.
- Validate consent behavior and privacy disclosure before marketing tags load. A script's presence does not prove correct event collection.
- Create a staging debug protocol, production real-time validation, and monthly reconciliation against PMS bookings and routed leads.

Public detection found GoDaddy signal/traffic scripts but no identifiable GA4 measurement ID, GTM container, Google Ads tag, Meta Pixel, or Hotjar implementation. This does not prove that no admin-side or server-side tracking exists; it means it was not publicly detectable in the tested pages.

## 17. Questions and unavailable evidence

1. Which inboxes should Contact and Monthly inquiries reach, and can the owner provide a real authorized phone number for a second test?
2. Does MotoPress or another PMS create an inventory hold when a checkout session opens, and when does that hold expire?
3. Which price is intended on Home, Listings, property details, and search results? Are static rates cached, base rates, or accidental content values?
4. Are pet fees mandatory for every pet stay, and can MotoPress calculate them before confirmation?
5. What are the verified maximum occupancy, bed allocation, minimum stay, check-in, and check-out values for every property?
6. Is 324 129th St S in ZIP 98444, and should Parkland rather than Tacoma be used for guest-facing location context?
7. Which public Airbnb, Vrbo/Expedia, Booking.com, Furnished Finder, and Google property IDs map to each direct-site property?
8. Is a Google Vacation Rentals connectivity partner already connected outside the visible MotoPress implementation?
9. Are GA4, Google Ads, Meta, Microsoft UET, call tracking, or server-side events configured administratively?
10. What cookies/local storage are set by GoDaddy, MotoPress, Stripe, and marketing tools before consent in each target jurisdiction?
11. Does the Stripe/payment flow authorize, capture, send confirmations, and write the correct reservation to the PMS? A controlled test reservation/refund is required later.
12. Do booking-confirmed, failed, canceled, and reservation-received states show correct content only when reached with a valid transaction?
13. Which cancellation policy/rate plans are actually configured, and are deposits/preauthorizations refundable?
14. Should the Rosella guide and exact property address be public/indexable or guest-only?
15. Are there formal accessibility accommodations for any unit, and which statements can be made accurately?
16. Search Console, analytics, ad accounts, Core Web Vitals field data, rankings, traffic, revenue, and real search volume were unavailable and were not inferred.
17. Inbox delivery, spam placement, Reply-To behavior, and acknowledgement emails remain untested because the phone field blocked both submissions.
18. Payment processing, confirmation, inventory release, cancellation, refund, and actual reservation creation were intentionally not tested.

## 18. Staged implementation plan

| Batch | Scope | Staging verification | Rollback criterion |
|---|---|---|---|
| 1 — Data freeze and critical content | Property master sheet; correct ZIP/transit/capacity/check-in/out; complete policies; FAQ correction | Owner signs off one row/property and all policy text; automated search for placeholders | Any unresolved fact or policy conflict |
| 2 — Booking-path repair | MotoPress date normalization, preserved criteria, visible result CTA, occupancy/min-stay rules, edit search | Matrix of 11 properties × desktop/mobile × available/unavailable/over-capacity; no booking created in nonproduction | Criteria/price changes unexpectedly, inventory impact, generic error, or checkout session cannot be cleared |
| 3 — Price/fee transparency | Replace static prices; itemized totals; pet/deposit/cancellation disclosure | Same itineraries reconcile search/property/checkout/PMS; pet/no-pet cases | Any mandatory charge appears only after final action or mismatches PMS |
| 4 — Forms and routing | Optional/explained phone, source/category, success states, acknowledgement, spam controls | One authorized test per route with unique IDs; inbox/reply/spam checklist passes | Duplicate/missing delivery, wrong inbox, marketing opt-in, exposed PII |
| 5 — Global template/responsive | Unified header/footer, Monthly/Book CTA, tablet overflow, accessibility names/targets/headings | 390/768/1366/1440 visual and keyboard regression on all templates | Horizontal scroll, obscured content, navigation/booking regression |
| 6 — SEO/index cleanup | Sitemap/noindex, metadata, H1s, canonicals, schema, social cards | Crawl staging; schema validators; planned index list approved | Canonical property or required operational URL becomes blocked/noindex incorrectly |
| 7 — Performance/media | Responsive images, lazy gallery, script/plugin reduction, caching | Before/after Lighthouse and WebPageTest on home/property/search/checkout; visual comparison | Gallery, booking, forms, or consent breaks; worse key metrics |
| 8 — Landing pages | Three market pages plus upgraded monthly hub | Content uniqueness, fact/source review, internal links, CTA/event tests, ad message-match review | Thin/duplicative content or unsupported operational claims |
| 9 — Measurement/consent | GA4/Ads/UET/Meta as approved, event schema, attribution, consent | Tag debugger, test traffic, consent-state network audit, server/PMS reconciliation | PII leakage, pre-consent firing where prohibited, double-counted purchase |
| 10 — Controlled production test | Publish approved batches; one real low-risk test reservation and cancellation/refund under owner supervision | Confirmation email, PMS record, inventory, payment/refund, analytics/ad conversion all reconcile | Any charge/inventory/email mismatch; disable affected change and revert |

Each batch should be a separate staging change set with a pre-change backup, screenshots/data snapshots, an owner acceptance checklist, and a documented rollback. Do not combine booking/payment changes with broad Elementor/plugin updates.

---

### Evidence notes

- Public-site evidence was gathered through browser navigation, DOM/accessible-name inspection, responsive rendering, form validation, and safe availability/checkout interaction.
- `robots.txt` allows normal public crawling and declares `/wp-sitemap.xml`; all 69 discovered URLs loaded.
- Google Vacation Rentals conclusions distinguish public evidence from items requiring Hotel Center/PMS access.
- OTA comparisons are limited to publicly attributable results. Public search found the DuPont home on Vrbo/Expedia/Google and a Puyallup unit on Airbnb/Booking.com-related results; no owner-supplied channel inventory was available for a complete one-to-one reconciliation.
- No ranking, traffic, conversion-rate, search-volume, revenue, Core Web Vitals field, or inbox-delivery claim was fabricated.
