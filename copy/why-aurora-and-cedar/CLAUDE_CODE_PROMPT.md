# Claude Code task: publish "Why Aurora & Cedar?" on auroraandcedarstays.com (v2)

Paste this whole file into Claude Code, run from the unzipped `why-aurora-and-cedar/` folder.

## What you're building

A new sub-page of About, **Why Aurora & Cedar?**, at `/about/why-aurora-and-cedar/`. It tells the story behind the brand name and the reclaimed cedar-and-antler accent wall at the Fairbanks home at 10 Rosella Ave.

**Do not redesign or rearrange the About page.** The only change there is a single line of text that links to the new page (step 5).

The approved design is `mockup/index.html`. Open it in a browser first; the live page should match it. Its header and footer are mockup-only, since the site's real header and footer will wrap the page.

## Files in this folder

| Path | What it is |
|---|---|
| `mockup/index.html` | Approved mockup. |
| `production/why-aurora-and-cedar.page.html` | The page body that goes live. Images are written as `{{MEDIA:filename}}` placeholders. |
| `production/acs-why.css` | All styles, scoped under `.acs-why`, using the site's own Elementor global colors and fonts (Playfair Display + Inter). |
| `production/about-link.html` | The one-line link for the About page. |
| `images/` | 17 web-ready JPGs, plus `image-manifest.csv` with alt text, caption and source for each. `mockup-logo.png` is for the mockup only; do not upload it. |
| `copy.md` | Every word on the page, plus the SEO title and meta description. |

## Site context

- WordPress on GoDaddy Managed WordPress, hello-elementor theme, Elementor + ElementsKit, MotoPress Hotel Booking, WPvivid for backups. A GoDaddy staging site exists.
- Brand globals already on the site: slate `#344856`, sage `#8CB7A8`, text `#58544F`, ivory `#FFFCF9`, sand `#DFD3C7`.
- Contact: Hello@AuroraAndCedarStays.com, +1 (205) 341-7045.

## Ground rules

- Use Claude in Chrome. Andrew is logged into wp-admin. Never log in or type passwords yourself. If something needs his login, 2FA, or accepting terms, stop and give him the exact click steps.
- **Take a WPvivid backup (Database + Files) before you change anything.**
- Build the new page as a **Draft** and leave it unpublished until Andrew approves.
- **Never edit plugin or theme files.** Custom CSS goes in the site plugin `wp-content/plugins/acs-site/acs-site.php` ("ACS Site Customizations"). Create it if it doesn't exist yet, with one clearly commented section per feature.
- Log what you do to `website-fix-log.md` as you go.
- Do not change any copy. If something reads wrong, flag it for Andrew instead of rewording.

## Steps

### 1. Upload the images
Upload every `.jpg` in `images/` to the Media Library. For each, set **Alt Text** and **Caption** from `image-manifest.csv`. Keep the filenames. Record each uploaded file's full-size URL; you need them in step 3.

### 2. Add the stylesheet
Copy `production/acs-why.css` to `wp-content/plugins/acs-site/assets/acs-why.css`. In `acs-site.php`, add a section "Why Aurora & Cedar page styles" that enqueues it only on the new page:

```php
add_action('wp_enqueue_scripts', function () {
    if (is_page('why-aurora-and-cedar')) {
        wp_enqueue_style('acs-why', plugins_url('assets/acs-why.css', __FILE__), [], '2.0');
    }
});
```

Upload via SSH/SFTP or the GoDaddy file manager. If the plugin is new, activate it.

### 3. Create the page
- Pages → Add New. Title **Why Aurora & Cedar?**, slug `why-aurora-and-cedar`, parent **About**.
- Edit with Elementor. Page Settings: template **Elementor Full Width** (keeps the site header and footer) and turn on **Hide Title**, so the hero's H1 is the only H1 on the page.
- Add one full-width container with zero padding, and one **HTML** widget inside it.
- Paste in `production/why-aurora-and-cedar.page.html` with every `{{MEDIA:filename}}` replaced by that file's Media Library URL from step 1. The hero image is a CSS `background-image` URL in a `style` attribute; replace that one too.
- If an SEO plugin (Rank Math or Yoast) is active, set the SEO title and meta description from `copy.md`.
- Save as **Draft**.

### 4. Check the draft
Preview at desktop (1366px) and phone (400px) widths and compare with `mockup/index.html`. Confirm:
- the fonts are Playfair Display and Inter, not a fallback
- the two antler rings ("Saved for later" and "On our wall now") sit on the antlers in both photos
- the Then / Now labels sit on the split cabin-and-duplex image near the bottom
- the breadcrumb's "About" link goes to `/about/`
- no sideways scrolling at phone width
- every image loads and both booking buttons go to `/rental-unit-in-fairbanks/`
- there's exactly one H1

Send Andrew the preview link and screenshots. **Stop here until he approves.**

### 5. After Andrew approves
- Publish the page.
- On the About page, add the line from `production/about-link.html` as the last paragraph of the "Our story" text, with the link pointing to the published page's URL. **Change nothing else on About:** no new sections, images or styling.
- Flush the GoDaddy cache. Check both pages logged out with `?cb=<timestamp>` on the URL.
- Note: Andrew's home Wi-Fi content filter blocks this domain. Verify from an outside network, not from his home connection.

### 6. Report back
List what changed, the live URL, the backup name, and screenshots of the new page and the About-page link. Note anything you couldn't match to the mockup.

## Later
- When 10 Rosella gets its own listing page, Andrew may want both booking buttons pointed there instead of `/rental-unit-in-fairbanks/` (the other unit in the same duplex).
- Optional, only if Andrew asks: rebuild with native Elementor widgets instead of one HTML widget, so text can be edited in the visual editor. Keep the `.acs-why` classes and CSS so the design doesn't change.
