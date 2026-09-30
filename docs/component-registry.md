# Component registry

Tracks reference → implementation mappings and where each block is used.
Update this whenever a block is created, renamed, or given a new variant.

| Block | Variants | Reference source | Used on | Notes |
|---|---|---|---|---|
| `header` | — | HP global nav (simplified) | all pages | Content authored at `/nav`. Simplified primary nav (Laptops/Desktops/Printers/Accessories/Support) instead of HP's full mega-menu. |
| `footer` | — | HP global footer (simplified) | all pages | Content authored at `/footer`. 4 columns + legal row + copyright; country selector and "Stay connected" social column omitted (see measurements doc). |
| `hero` | — | `.c-hp-hero-banner` | / (next-gen-ai-pcs) | Side-by-side split: white/light content panel (eyebrow + h1 + subtitle + badge row) + image, stacked image-on-top at mobile, image on the right from 1200px up. **Corrected from an initial full-bleed dark-overlay guess** — verified against a real Playwright screenshot of the reference, which shows a plain white background with dark text, not a scrim over a background photo. `hero.js` groups content defensively (first `<p>` before h1 = eyebrow, first `<p>` after h1 without an image = subtitle, `<p>` containing only an `<img>` = badge). |
| `section-nav` | — | HP anchor-navigation component | / | Sticky in-page jump links + a CTA. Targets sections via `data-id` set by a `Section Metadata` `Id` row (EDS gives no native way to id arbitrary elements). |
| `cards` | `benefits`, `portfolio`, `product`, `feature` | `.c-hp-tat` / category tiles / product tiles / "Keep business moving" tiles | / | Reused boilerplate `cards` block for four visually-distinct grids instead of four new components — differences are pure CSS driven by the variant class. `feature` (image-top, landscape aspect ratio, no CTA) replaced an earlier, incorrect `columns alternating` build of "Keep business moving" — a real screenshot of the reference showed a flat 4-up grid, not alternating image/text rows. |
| `promo` | `dark` | `.c-hp-bg-container` / media-content split banners | / (HP IQ, Security, Business-ready, Other laptops) | One block reused 4×: image + heading + copy + 1-2 CTAs, side-by-side (image position follows authored row order — whichever row comes first in content renders on that side). Default variant = light-gray section background, rounded contained image, dark text (Security, Business-ready, Other-laptops). `dark` variant = solid dark background, image bleeds to the block edge, white text (HP IQ only). **Corrected from an initial guess that all 4 were full-bleed dark-overlay banners** — a real reference screenshot showed only HP IQ is; the other three are light split-panel layouts. Other-laptops' real diagonal white/blue color-block treatment is approximated with the plain light variant (simplification, not silently dropped). |
| `accordion` | — | `.c-hp-collapsible-section` (FAQ) | / | Native `<details>/<summary>` — zero JS behavior needed beyond DOM restructuring. |

## Reference → implementation name mapping

| HP's name (from DOM classes) | This project's block |
|---|---|
| `c-hp-hero-banner` | `hero` |
| `c-hp-tat` (title-and-text tile) | `cards` (variant per grid) |
| `c-hp-collapsible-section` | `accordion` |
| `c-hp-bg-container` / media-content | `promo` |
| anchor-navigation component | `section-nav` |

## Validation tooling

`tools/playwright/{capture,validate}.js` — real devDependency-backed visual
validation (`npm run validate`). Screenshots (full-page + per-block),
computed-style measurements, console-error capture, and a heading-outline
diff, for the implementation alone or against the live reference. This is
what caught the `hero`/`promo`/"Keep business moving" architecture
mistakes above — screenshots aren't optional polish, they're how those
were found. `tools/lighthouse/run.js` — Lighthouse audit (`npm run
lighthouse`) against a deployed URL.
