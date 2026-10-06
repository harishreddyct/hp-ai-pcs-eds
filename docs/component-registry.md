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
| `promo` | `dark`, `large`, `offset`, `compact` | `.c-hp-bg-container` / `.c-hp-media-content` / `.c-hp-contained-section-block` | / and /us-en/ai-solutions/next-gen-ai-pcs (HP IQ, ROI calculator, Security, Business-ready, Other laptops) | Image + heading + copy + 1-2 CTAs; image side follows authored row order. Default = image-first split on light gray (Security). `large` = white panel, xxl title, square image (ROI calculator). `offset` = text-first split, copy pushed down on desktop (Business-ready). `compact` = white rounded box inset in a gray section, heading + buttons only, dark primary button; the diagonal white/blue is part of the photo (Other laptops). `dark` = full-bleed rounded photo with text overlaid, light primary / light outline secondary buttons (HP IQ). Variants are explicit classes emitted by the importer (`tools/importer/parsers/promo.js`) — the homepage content (`/`) still authors plain `promo` and should be updated to `promo (offset)` / `promo (compact)` for Business-ready / Other laptops to pick up those layouts. |
| `accordion` | — | `.c-hp-collapsible-section` (FAQ) | / | Native `<details>/<summary>` — zero JS behavior needed beyond DOM restructuring. |
| `footnotes` | — | `.c-hp-footnotes` | / | Single collapsible small-print panel (native `<details>/<summary>`, open by default like the source, +/× toggle). Row 1 = title, row 2 = disclaimer paragraphs + numbered footnote list. Dedicated block instead of reusing `accordion` (one toggle, list body, small-print type). |

## Reference → implementation name mapping

| HP's name (from DOM classes) | This project's block |
|---|---|
| `c-hp-hero-banner` | `hero` |
| `c-hp-tat` (title-and-text tile) | `cards` (variant per grid) |
| `c-hp-collapsible-section` | `accordion` |
| `c-hp-footnotes` | `footnotes` |
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
