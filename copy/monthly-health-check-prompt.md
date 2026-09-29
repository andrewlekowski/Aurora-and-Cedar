# Monthly health check: scheduled task

Needs Claude in Chrome on Andrew's computer. The site and Airbnb are blocked from cloud sessions.
Set it up in the Claude Desktop app → Scheduled tasks → New → Monthly, 1st of the month, 8:00 AM Alaska time. Paste this prompt:

---
Run the Aurora & Cedar Stays monthly health check using Claude in Chrome. Open your own tab. Don't log in, don't type passwords, don't change anything. This is report-only.
1. Load every public page of https://auroraandcedarstays.com logged out with `?cb=<timestamp>` (list pages from /wp-sitemap.xml or the SEO sitemap). Flag 4xx/5xx, `[bracketed placeholders]`, "Lorem", "Sample", "Hello world", demo names (Sarah Johnson, Michael Anderson, Emily Carter), and broken links and images.
2. For all 11 homes, get a 3-night and a 7-night checkout quote (stop before payment). Check that the 3-night nightly price matches the "From $X/night" shown on the listing, and that the 7-night quote shows the 10% weekly discount.
3. Open https://www.airbnb.com/users/profile/1468195747710744291, read the "N reviews" count, and report it. If Andrew has approved automatic updates, set the WordPress option `acs_review_count` (wp-admin/options.php) to that number.
4. In wp-admin, check MPHB → Sync Calendars status. Flag any home blocked more than 90 days ahead (e.g. the Fairbanks Airbnb availability window). Don't change Airbnb.
5. Check WPvivid → Backups: the last backup date. List pending plugin, theme and core updates.
6. Warn if the Weekend season or any rate ends within 60 days (currently Jun 30, 2027).
7. Send Andrew a short report: what's fine, what's broken, what needs his decision.
---
