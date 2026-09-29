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

## 2026-09-29: phase 2 (cloud session, no live changes)
Still no Chrome and still blocked by the network policy (site, Airbnb, wordpress.org). Built the `acs-site` plugin (staging-first, see its README) and the monthly health-check prompt. Wrote `phase-2-report.md`.
Andrew (Sep 29): he's an **Army aviation veteran, former Apache pilot**, not active duty. The About draft is updated.
