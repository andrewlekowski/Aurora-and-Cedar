# Cross streets and maps (#6): DRAFT, needs Andrew's OK

**Nothing here is live.** Right now every listing page shows the **full street address** (unit numbers included) and a Google Map pinned to that exact address. The proposal: show cross streets and a neighborhood-level map on the site, and send the exact address in the booking confirmation and arrival instructions.

Checked on Google Maps on Sep 28, 2026. Note: in Andrew's Google account, Maps labels 10 Rosella Ave as **"Home"**.

| Listing (page ID) | Address shown now | Proposed text | Map embed query (zoom 15) |
|---|---|---|---|
| 3BR near PLU & JBLM (1077) | 328 129th St S, Tacoma 98444 | 129th St S & C St S, Parkland (Tacoma), WA | `129th St S & C St S, Tacoma, WA 98444` |
| NEW 2/1 near JBLM & PLU (1265) | 324 129th St S, Tacoma **98344** (typo, should be 98444) | same as above | same as above |
| Entire Duplex near PLU (1325) | 324 and 328 129th St S, Tacoma 98444 | same as above | same as above |
| CHIC (1365) | 1009 9th St NW **Unit 1**, Puyallup 98371 | 9th St NW & 11th Ave NW, Puyallup, WA (off River Rd) | `9th St NW & 11th Ave NW, Puyallup, WA 98371` |
| 2BD w/ backyard (1424) | 1009 9th St NW Unit 2 | same as above | same as above |
| Puyallup 2/1 (1449) | 1009 9th St NW Unit 4 Upper Level | same as above | same as above |
| Basement studio (1481) | 1009 9th St NW Unit 4 Lower Level | same as above | same as above |
| 2 Apts (1503) | 1009 9th St NW Units 1 and 2 | same as above | same as above |
| 4 Apts (1536) | 1009 9th St NW | same as above | same as above |
| 4BR near JBLM (1560) | 408 DuPont Ave, DuPont 98327 | DuPont Ave & Repauno St, historic DuPont, WA | `DuPont Ave & Repauno St, DuPont, WA 98327` |
| Fairbanks (1722) | 10 Rosella Ave, Fairbanks 99701 (map only) | Rosella Ave & College Rd, Fairbanks, AK (across from Creamer's Field) | `Rosella Ave & College Rd, Fairbanks, AK 99701` |

## How to apply (once approved)
- In each listing's Elementor page, replace the address text line and the Google Maps widget's address with the cross-street text and query above. Set the map zoom to 15.
- The Fairbanks page and `/rosella-guide/` ("Good Neighbor Guide: 10 & 10½ Rosella") also have "Rosella" in the page title and slug. Decide whether to rename the guide to something like "Good Neighbor Guide: Fairbanks" and set up a Redirection 301 from the old slug. The Redirection plugin is installed.
- Make sure the exact address is still in MPHB → Customer Emails (the booking-confirmed email) and in the arrival instructions.

## Decisions for Andrew
1. OK to hide exact addresses and unit numbers on the site?
2. Rename the Rosella guide page and its slug?
