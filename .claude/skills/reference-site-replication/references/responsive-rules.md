# Responsive implementation rules

A component that only matches the reference at one viewport width isn't actually a match — it's a coincidence. Reproduce the reference site's responsive *behavior*, not just its desktop appearance.

## Mobile-first, always

Build and reason about every component mobile-first: write the base styles (no media query) for the smallest screen, then progressively enhance upward with `min-width` media queries as the viewport grows. Never do the reverse — writing full desktop styles first and then patching them down with `max-width` overrides. Mobile-first isn't just a build-order preference here; it's the required approach, because:

- It's how most modern component-based systems are conventionally authored (e.g. EDS blocks: base rules unscoped, enhancements gated behind `min-width`) — following it keeps the target project idiomatic rather than introducing a second convention.
- It keeps the cascade simple: each breakpoint only *adds* or *overrides* forward, so there's one direction of complexity to reason about instead of two.
- It forces the mobile layout to be a real, deliberate design rather than an afterthought derived by subtraction from desktop.

Avoid `max-width` media queries entirely unless there's a genuinely isolated case that can't be expressed any other way — and if you reach for one, treat it as a signal to double check the mobile-first structure rather than the default tool.

## Breakpoint scale

Build against a single, consistent mobile-first scale for the whole project — never mix scales page to page or component to component. The standard scale (fixed for now — revisit only if explicitly asked to):

- **Base** (no media query) — styles apply from 0px up; this *is* the mobile layout, not a fallback.
- **`min-width: 768px`** — tablet and up.
- **`min-width: 960px`** — small desktop / laptop and up.
- **`min-width: 1200px`** — large desktop and up.

Every component's CSS should be structured as base rules followed by these three `min-width` blocks in ascending order:

```css
.block {
  /* base / mobile styles */
}

@media (min-width: 768px) {
  .block {
    /* tablet-and-up overrides */
  }
}

@media (min-width: 960px) {
  .block {
    /* small-desktop-and-up overrides */
  }
}

@media (min-width: 1200px) {
  .block {
    /* large-desktop-and-up overrides */
  }
}
```

Use this scale for every page and component in the build — it's a project-wide decision, not a per-reference-site or per-page choice. When inspecting the reference site (Phase 1), map what you observe onto these four states (base, 768, 960, 1200) rather than reproducing whatever ad hoc breakpoints the reference site's own CSS happens to use. If the reference clearly changes behavior at a width that falls between two of these breakpoints (e.g. something shifts at 900px), fold that change into whichever breakpoint it's closest to reaching by, and note the discrepancy in the page or component registry rather than introducing an extra breakpoint.

### Collapsing extra reference tiers

A reference component sometimes has more breakpoint tiers than this scale's three — e.g. it changes a grid from 1 to 2 to 3 columns across four of its own breakpoints. When that happens, collapse adjacent reference tiers onto the nearest of the three, preserving the resulting look at each of *our* tiers rather than trying to preserve every one of the reference's own thresholds. Record the specific mapping per component in the component registry (which reference tier landed on which project tier, and why) so the approximation is auditable later rather than a silent guess — "reference's 1024px tier became this project's 1200px tier since our scale has nothing between 960 and 1200 close to 1024" is the right level of detail.

### Normalizing an internally inconsistent reference

Some reference sites are mostly mobile-first but ship one component desktop-first (`max-width` queries) as an inconsistency in their own codebase — this does happen, and it's not a sign you misread something. Always convert to this mobile-first convention regardless; don't preserve the reference's inconsistency just because it's what's there. Preserve the *resulting appearance* at each width, and note in the component registry that this was a deliberate normalization (with the reference's original tiers listed) so a future reader doesn't mistake the conversion for an implementation error.

## What to check at each breakpoint

- **Navigation** — does it collapse into a mobile menu, and at what width? How does the mobile menu open/close?
- **Typography** — do heading/body sizes scale down, and via what steps?
- **Spacing** — do margins/padding/gaps compress at smaller widths, or stay fixed?
- **Grid columns** — how many columns does a card/content grid show at each width?
- **Card layout** — do cards stack, reflow, or change internal layout (e.g. image-left becomes image-top)?
- **Image dimensions** — are images cropped differently, or just scaled, at different widths?
- **Content stacking** — what switches from side-by-side to stacked, and at what width?
- **Visibility** — is anything shown/hidden entirely at certain widths (e.g. a sidebar that disappears on mobile)?
- **Alignment** — does text/content alignment change (e.g. centered on mobile, left-aligned on desktop)?
- **Padding/margins** — page-level and section-level, not just component-internal.
- **Buttons** — full-width on mobile vs. inline on desktop, stacking of button groups.
- **Forms** — field stacking, label positioning.
- **Overflow** — horizontal scroll regions (carousels, tables) and how they behave on touch.
- **Mobile menus** — full pattern: trigger, open animation, focus handling, close behavior.
- **Sticky/fixed elements** — does a sticky header/CTA bar behave the same across widths, or only apply above/below a certain breakpoint?

## Implementation approach

- Use `min-width` media queries at 768 / 960 / 1200 for every layout decision — see "Mobile-first, always" above.
- Don't hardcode pixel dimensions observed at a single viewport as fixed values — express layout in relative/responsive terms (percentages, fluid grids, `clamp()`, breakpoint-specific overrides at 768/960/1200) so the component actually adapts rather than just looking right at the one width you happened to check.
- When a component's responsive behavior differs meaningfully between two breakpoints in a way that isn't a simple CSS change (e.g. desktop shows a hover-triggered dropdown, mobile shows a tap-triggered accordion), that's real behavioral branching — implement it as such rather than trying to force one interaction pattern to cover both.

## Validation

Checking responsive behavior means actually resizing/emulating each of the four states — base (mobile, below 768px), 768px, 960px, and 1200px — and comparing against the same viewport on the live reference; see `visual-validation.md` for the comparison loop. Do not infer mobile correctness from how the desktop layout "should" reflow; verify the base/mobile layout directly and first, since it's the foundation everything else builds on.
