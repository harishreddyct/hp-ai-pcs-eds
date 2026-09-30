# Measurements — HP AI PCs (next-gen-ai-pcs.html)

Reference: https://www.hp.com/us-en/ai-solutions/next-gen-ai-pcs.html
Extracted from the live page's server-rendered HTML and its own delivered CSS
(`visID.theme.css`, `theme-visID-hero-banner.css`) on 2026-09-30. No browser/
screenshot tool was available in this environment, so these are real
measured values pulled from the reference's actual CSS source (not
eyeballed from a screenshot) — see the "Limitations" note at the bottom.

## Breakpoints

This project follows the skill's fixed authoring scale — 768px / 960px /
1200px — rather than HP's own breakpoints (their theme switches at 441px /
1115px / 1681px). Where HP has 3 typographic tiers, they map onto our
768px and 1200px steps.

## Layout container

- Max width: **1680px** (`--hpi color / c-hp-container`, real measured value)
- Side padding: 16px (mobile) → 32px (≥768px) → 36px (≥1200px)

## Colors (from `visID.theme.css` custom properties)

- Primary/brand blue: `#024ad8` (hover `#103fb2`)
- Text (default): `#1a1a1a`
- White: `#fff`
- Light gray surfaces: `#fafafa`, `#f5f5f5`, `#f0f0f0`, `#e8e8e8`
- Mid gray (borders/secondary text): `#c2c2c2`, `#858585`
- Dark surfaces (promo/security overlay): `#1a1a1a`, `#212121`, `#292929`

## Typography

Font: HP's theme uses the licensed `forma-djr-micro` font. That's a paid
Adobe/Monotype font we can't vendor, so we use HP's own documented fallback
(`Arial, sans-serif`) as the primary stack — this is not a guess, it's
literally HP's `--font` fallback value.

| Style | Mobile | ≥768px | ≥1200px | Weight |
|---|---|---|---|---|
| h1 / title-large | 44px/44px | 56px/56px | 72px/72px | 500 |
| h2 / title-medium | 36px/36px | 44px/44px | 56px/56px | 500 |
| h3 / title-small | 24px/24px | 28px/28px | 32px/32px | 500 |
| subtitle-large | 18px/24px | 20px/24px | 24px/28px | 500 |
| body-extra-large | 18px/24px | 18px/24px | 20px/24px | 400 |
| body-regular | 14px/24px | 14px/24px | 16px/24px | 400 |
| overline (eyebrow) | 12px/16px | 14px/20px | 16px/20px | 500 |

## Buttons

- Primary: bg `#024ad8`, text `#fff`, hover bg `#103fb2`
- Pill shape (`border-radius` large / fully rounded), matches boilerplate's
  existing `.button` pill styles — reused as-is with brand colors substituted.

## Page sections (in order) and content inventory

1. **Hero** — eyebrow "AI that works for you and on your terms", h1 "HP AI
   PCs", subtitle, Windows 11 + Copilot+ PC badges, full-bleed background
   photo.
2. **Section nav** (anchor jump links) — Benefits / Portfolio / Featured
   Products / FAQs + "Contact Sales" CTA.
3. **Benefits** (`#benefits`) — heading + intro + 4 icon cards.
4. **Portfolio** (`#portfolio`) — heading + intro + 3 image cards (AI at
   home / AI at work / AI workstations), each with a "Learn" link.
5. **Featured products** (`#products`) — heading + intro + 2 product cards
   (HP EliteBook X G2i, HP OmniBook Ultra G1i).
6. **Keep business moving** — heading + 4 alternating image/text rows.
7. **HP IQ promo** — heading + copy + Copilot+ badge image + "Watch Video"
   / "Learn" CTAs.
8. **Security promo** (dark) — heading + copy + footnote superscripts +
   "Learn" CTA, dark overlay on background photo.
9. **Business-ready promo** — heading + copy + "Shop" CTA.
10. **Other-laptops promo** — heading + "Explore HP Home Laptops" / "Shop
    all Laptops" CTAs.
11. **FAQs** (`#faqs`) — 10 question/answer pairs (native accordion) +
    footnote/disclaimer small print.

## Simplifications vs. the reference (recorded intentionally, not oversights)

- **Global header nav**: HP's real header is a full e-commerce mega-menu
  (Laptops/Desktops/Printers/Accessories/Subscriptions/Support, cart,
  account, 190+ links). This project is a single marketing page, so the
  header carries a small representative primary nav instead of the full
  mega-menu. Recorded here, not silently dropped.
- **Footer country/language selector**: the reference lists 90+
  country/language links. Omitted as out of scope for a single-page
  recreation; the 4 real footer columns (About Us / Ways to buy / Support
  / HP Partners) and the legal link row are kept.
- **"Stay connected" footer column**: reference content here is icon-only
  social links with no visible text in the server HTML, so the exact
  target URLs couldn't be reliably extracted. Per the skill's conservatism
  rule, omitted rather than invented.
- **HP wordmark**: the reference logo is an inline SVG sprite reference
  (`#digitnav-logo-icon`) rather than a fetchable image URL, so the header
  brand is a styled text wordmark in the brand blue instead of the vendored
  mark.
- **Trademarked badges** (Windows 11 logo, Copilot+ PC badge): user
  confirmed using the real HP-hosted images directly (see conversation).

## Limitations

No browser/Playwright tool was available in this environment, so Phase 6
(live visual diff at each breakpoint) could not be performed against a
rendered screenshot. Typography/color/spacing values above are real,
measured values read directly from the reference's own delivered CSS
source (not eyeballed), which is the most reliable substitute available
here — but side-by-side pixel comparison and Lighthouse were not run
against a live preview at authoring time. Re-verify visually once the
site is previewing on `aem.page`.
