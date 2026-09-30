# Component registry

Tracks reference → implementation mappings and where each block is used.
Update this whenever a block is created, renamed, or given a new variant.

| Block | Variants | Reference source | Used on | Notes |
|---|---|---|---|---|
| `header` | — | HP global nav (simplified) | all pages | Content authored at `/nav`. Simplified primary nav (Laptops/Desktops/Printers/Accessories/Support) instead of HP's full mega-menu. |
| `footer` | — | HP global footer (simplified) | all pages | Content authored at `/footer`. 4 columns + legal row + copyright; country selector and "Stay connected" social column omitted (see measurements doc). |
| `hero` | — | `.c-hp-hero-banner` | / (next-gen-ai-pcs) | Eyebrow + h1 + subtitle + badge row + full-bleed background image. `hero.js` groups content defensively (first `<p>` before h1 = eyebrow, first `<p>` after h1 without an image = subtitle, `<p>` containing only an `<img>` = badge). |
| `section-nav` | — | HP anchor-navigation component | / | Sticky in-page jump links + a CTA. Targets sections via `data-id` set by a `Section Metadata` `Id` row (EDS gives no native way to id arbitrary elements). |
| `cards` | `benefits`, `portfolio`, `product` | `.c-hp-tat` / category tiles / product tiles | / | Reused boilerplate `cards` block for three visually-distinct grids instead of three new components — differences are pure CSS driven by the variant class. |
| `columns` | `alternating` | media-content component | / (Keep business moving) | Existing boilerplate `columns` block; `alternating` variant reverses image/text order on even rows at desktop. |
| `promo` | `dark` | `.c-hp-bg-container` full-bleed banners | / (HP IQ, Security, Business-ready, Other laptops) | One new block reused 4×: background image + heading + copy + 1-2 CTAs. `dark` variant is used for the Security section's dark overlay/light text. |
| `accordion` | — | `.c-hp-collapsible-section` (FAQ) | / | Native `<details>/<summary>` — zero JS behavior needed beyond DOM restructuring. |

## Reference → implementation name mapping

| HP's name (from DOM classes) | This project's block |
|---|---|
| `c-hp-hero-banner` | `hero` |
| `c-hp-tat` (title-and-text tile) | `cards` (variant per grid) |
| `c-hp-collapsible-section` | `accordion` |
| `c-hp-bg-container` | `promo` |
| anchor-navigation component | `section-nav` |
