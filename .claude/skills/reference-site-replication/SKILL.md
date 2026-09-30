---
name: reference-site-replication
description: Use this skill whenever the user wants to recreate, replicate, clone, or rebuild an existing website, web page, or set of pages by pointing at one or more reference URLs — phrases like "recreate this site", "clone this page", "rebuild our marketing site from thecompetitor.com", "match this page's design", "build these pages to look like <url>", or "implement this reference site as code so it looks the same". Always reach for this skill even if the user supplies only a single URL, since one page today is often the first of many that will need to share components later, and even if they don't use the word "clone" — "build our new pricing page to look like stripe.com/pricing" should trigger it too. This is NOT a one-shot screenshot-to-code task: it drives a structured process that first understands the reference site's component system, page architecture, and responsive behavior, then implements the target as a maintainable set of shared, reusable components rather than one-off page copies. Also use this skill when adding a new page to a codebase that must visually match a reference site already being replicated, or when asked to keep an existing replicated site in sync with new reference pages.
---

# Reference Site Replication

Recreates an existing website (or a set of its pages) from reference URLs while preserving visual structure, responsive behavior, and — critically — the site's **component architecture**. The output must read like a maintainable production codebase: shared components used across pages, not a pile of independently generated, duplicated page implementations.

Detailed guidance for each phase lives in `references/`. Read the relevant file when you reach that phase rather than trying to hold everything in context at once.

This skill is project-agnostic and meant to be copied between projects unchanged: every project-specific fact is discovered in Phase 0, and the filled-in component/page registries are created in the *target* project (e.g. `docs/`), never recorded back into this skill folder. See `README.md` for reuse and setup notes.

## Why this is hard to get wrong

The natural failure mode is treating each reference page as its own little project: screenshot it, generate matching HTML/CSS, move to the next page. On a large site this produces `HomeHero`, `AboutHero`, `ServicesHero` — three copies of one component — and any future design tweak has to be repeated N times and will drift. The point of this skill is to prevent that by discovering the *system* behind the pages before writing page code, and by checking every new page against what already exists before creating anything new.

The second, equally common failure mode is treating this as a purely visual task: match the screenshot and stop. Visual fidelity is necessary but not sufficient — see "Target architecture and quality bar" below.

## Target architecture and quality bar

This skill targets **Adobe Edge Delivery Services (EDS)**. Unless the existing target project already requires something else, prefer EDS blocks, vanilla JavaScript/CSS, semantic HTML, and document-driven content over introducing React, Next.js, or any other framework/large client-side runtime — a dependency brought in to make one block easier almost always costs more than the vanilla EDS pattern it replaces. Phase 0 below still governs what the *actual* target project is; this is the default to reach for when it is (or is being scaffolded as) EDS, not a license to force EDS patterns onto a genuinely different existing architecture.

The output must not only look like the reference — it must be a production-quality implementation that is fast, crawlable, accessible, lightweight, responsive, and stable under real Core Web Vitals measurement. A page that is visually identical but ships unnecessary JavaScript, shifts layout on load, or has no meta description is not finished. Full detail: `references/eds-performance-seo.md`. The goal there is explicitly **not** "make Lighthouse say 100" — it's an implementation that naturally scores well because it's genuinely well-built; never trade away accessibility, maintainability, semantic HTML, correctness, or responsive behavior just to move a number.

## Workflow

Work through these phases in order. Don't skip straight to implementation.

**Phase 0 — Project discovery.** Before touching the reference site, understand the repository you're building into: framework, routing, package manager, styling solution, existing component structure, design tokens, breakpoints, coding/accessibility/testing conventions. Given this skill's EDS default (see above), check specifically for the project's existing EDS conventions first — its own `aem.js`/`scripts.js`, block folder layout, existing block patterns — and reuse those; don't introduce a competing architecture. If the project folder already holds a different, unrelated in-progress build (e.g. a previous replication of another reference site), ask before treating it as the base to extend. If Phase 0 finds nothing to build into at all, ask which stack to scaffold rather than defaulting to one — `references/discovery-process.md` has a full scaffold checklist for an EDS-style project specifically (root config, docs, and asset folders alongside `blocks/`/`scripts/`/`styles/`) for when that's the chosen (or already-implied) stack; for anything else, scaffold using that stack's own normal conventions.

**Phase 1 — Reference discovery.** For every supplied URL, inspect the live page (DOM, accessibility tree, computed styles, responsive behavior) to identify structural regions (header, nav, hero, cards, forms, footer, etc.), repeated patterns across pages, and component names wherever they're reliably exposed. Full process and naming sources: `references/discovery-process.md`.

**Phase 2 — Registries.** Before creating anything, check `references/component-registry.md` and `references/page-registry.md` (which you create and maintain in the target project, e.g. under `docs/` or wherever the project keeps such notes) for components and pages that already exist. These registries are the memory that makes reuse possible across a large, multi-session build — update them as you go, not just at the end.

**Phase 3 — Naming and reuse decisions.** Apply the rules in `references/naming-rules.md` before writing a single component: preserve reliable reference names, search the existing codebase, prefer a variant/prop over a new component, and never create page-prefixed duplicates (`Page1Hero`, `Page2Hero`) of the same component.

**Phase 3.5 — Extract measurements.** Before writing any code, run the exhaustive measurement extraction outlined in `references/measurement-extraction.md`: pull computed dimensions, typography, spacing, layout skeleton, and content inventory from the live reference at every required breakpoint. Record these in a measurements document (e.g. `docs/measurements-{page}.md`) — this is the spec you build against, not a screenshot. This is what prevents the most common failure mode (eyeballed spacing/type that "looks close" and is wrong): you cannot match a value you never measured.

**Phase 4 — Build to measured values.** Build shared components, then page-specific ones, then compose pages — implementing the measurements extracted in Phase 3.5, not guessing from screenshots. Order matters: components used by multiple pages get built (or reused) first; genuinely page-specific pieces come next; pages themselves should mostly be composition of the two, not large duplicated markup. Before adding JavaScript to any block, ask "can semantic HTML/CSS do this instead?" — see `references/eds-performance-seo.md`'s JavaScript performance section. **Building without the Phase 3.5 measurements is guessing** — if you catch yourself picking a "reasonable-looking" padding, gap, font-size, or margin during implementation, you skipped Phase 3.5; stop and go measure the reference's actual value. If the target project authors content through real Document Authoring (not just local scaffolding), also read `references/da-content-silent-failures.md` before pushing anything — a block or page can be pixel-correct locally and still ship broken because of a DA-specific silent failure that no local render would ever surface.

**Phase 5 — Responsive implementation.** Build mobile-first: base styles unscoped for the smallest screen, then progressively enhanced with `min-width` media queries at 768 / 960 / 1200 — this skill's fixed breakpoint scale. Never write desktop-first styles patched down with `max-width`. See `references/responsive-rules.md` for the full methodology and what to check at each breakpoint.

**Phase 6 — Visual and performance validation.** Run the app, open the reference and the implementation side by side at each breakpoint, diff them, fix, recheck — see `references/visual-validation.md` for the loop, the comparison checklist, and the accessibility/conservatism rules. Then run Lighthouse (or the environment's closest equivalent) and work through `references/eds-performance-seo.md` — Core Web Vitals, image/font/JS/CSS/third-party checks, and SEO fundamentals. **Neither pass alone is sufficient**: a page that looks right but scores poorly isn't done, and a page with a clean Lighthouse run that doesn't match the reference isn't done either.

**Phase 7 — Cross-page consistency.** Before and after modifying any shared component, check every page that uses it (via the component registry) so a fix for one page doesn't regress another.

**Phase 8 — Report.** Summarize what was done (see "Final report" below).

## Multi-page projects

For a site with many pages, don't recreate each page independently. Discover pages first, discover the shared components across all of them, build the shared components once, then build page-specific pieces, then assemble pages, then validate responsively across all pages, then do a cross-page consistency pass. If page A, B, and C all have a card grid that's visually the same component, the implementation should have one `Card` (or whatever its true name is) reused three times — never three near-identical copies.

## Engineering discipline

A few cross-cutting rules that apply throughout, not just in one phase:

- **Follow the existing project**, always: linting, formatting, naming conventions, folder structure, TypeScript/styling conventions, testing setup. Don't rewrite or reformat unrelated code, and don't touch components or files the current task doesn't require.
- **Assets**: use real assets from the reference site when they're legitimately available (e.g. served images, icon sets already vendored in the project). Never copy private/restricted source or paywalled/proprietary assets. When an exact asset can't be obtained, use a clearly-labeled placeholder and note it in the page registry rather than pretending it's the original. Keep small UI icons and content photography in separate folders (`icons/` vs `images/`) rather than one shared bucket — it's a small distinction but it's what most projects with both actually expect. Never hand-write a file that's meant to be generated (a lockfile, a build manifest) — run the real command, or leave it as an explicit outstanding step.
  - **Trademarked logos/brand marks are a decision for the user, not a default you pick silently.** A publicly-servable asset (200 over plain HTTPS, no auth) is not automatically fine to reproduce — a company's actual logo/wordmark stays a trademark question independent of whether it's fetchable. Don't unilaterally decide either way (neither "it's public so I'll use it" nor "it's a trademark so I'll withhold it") and don't consider a note buried in a registry file sufficient — the user is very unlikely to read component-registry.md/page-registry.md proactively. Surface it directly in your response to the user the moment you find it (name the asset, where it's used, and that it's a real trademarked mark), ask how they want to handle it, and only then proceed. Revisit this any time you're about to swap a placeholder for a "real" version of something logo-shaped.
- **Change control**: before a large architectural change (e.g. restructuring an existing shared component's props, or introducing a new styling pattern), state what needs to change, why, and which existing components/pages are affected — then prefer the smallest change that achieves it. Never delete or replace a reusable component without first checking the component registry for its usages.
- **Conservatism**: if something about the reference can't be reliably determined (an official component name, an exact asset, a precise color value), don't invent it — use a clearly-named semantic placeholder, record the uncertainty in the relevant registry, and move on. Two similar-looking components with genuinely different behavior stay two components; don't force a merge for the sake of a smaller diff.
- **Don't add CSS (or markup) that isn't in the reference just because it looks reasonable.** This is a different failure from the one above — it's not about something being undeterminable, it's about embellishing past what was actually confirmed once the real value *is* known. A `padding`, `gap`, `border-radius`, or reset that "would look better" or "seems like it's probably needed" has no place in the port unless the reference's actual CSS has it — every declared property should trace back to something you actually observed in the reference's real source, not to your own sense of polish. If you genuinely think the reference is missing something that would improve it, that's a suggestion to raise with the user, not a change to make silently while "porting."
- **A registry note is not a substitute for telling the user.** The component/page registries are memory for future sessions — they are not how you communicate something *right now* to the person you're working with. Any time you defer a decision that's genuinely the user's to make (not just the trademark case above — also things like "the reference's real content differs from what was guessed earlier, which version should ship," "an accessibility fix means deviating from the reference's exact visual behavior," "a required asset only exists behind a paywall/login"), say so directly in your response in the turn you discover it, and ask. Don't let "I noted it in the registry" stand in for that — the user is very unlikely to go read those files unprompted, and a decision left silently pending there effectively never gets made.
- **Minimize JavaScript on principle, not just when something happens to be slow.** Before writing any block JS, ask "can semantic HTML/CSS do this instead?" — a native `<details>`/`<summary>`, a `:hover`/`:focus-within` rule, or a CSS-only accordion/tab pattern beats an equivalent script on weight and reliability. When JS is genuinely needed, keep it scoped to the block that needs it. Full detail (Core Web Vitals, images, fonts, third-party scripts, CSS performance, SEO): `references/eds-performance-seo.md`.
- **Don't add a third-party script (analytics, embeds, widgets, tracking) unless the reference's actual functionality or an explicit requirement needs it** — reproducing a page's appearance rarely requires reproducing its marketing/analytics tags. When one genuinely is required, load it late, scope it to the pages that need it, and record its performance cost in the registry.
- **Validation tooling belongs to the project being built, not to whatever other project happens to have it installed.** Browser automation for visual validation (`references/visual-validation.md`) and Lighthouse or its equivalent for the performance pass (`references/eds-performance-seo.md`) must each be added as a real `devDependency` of the target project, with any driver script checked into that project (e.g. under `tools/`). Never depend on a sibling/previous project's install on disk — every project this skill is used on gets its own, independently runnable copy of this tooling.

## Validation checklist

Before calling any page complete, confirm all of the following (details for each in the linked reference files):

- Reference URL(s) inspected and structure identified (`discovery-process.md`)
- Measurements extracted from the reference before building — dimensions, typography, spacing, layout skeleton, content inventory — and used as the build spec (`measurement-extraction.md`)
- Existing codebase and registries searched before creating components (`naming-rules.md`, `component-registry.md`)
- Component names preserved where reliably known; registry updated with any reference→implementation mapping
- No unnecessary duplicate components created; page registry updated
- Responsive behavior implemented and checked at all required breakpoints (`responsive-rules.md`), and spot-checked at real device widths (`eds-performance-seo.md`)
- Accessibility preserved or improved (`visual-validation.md`, `eds-performance-seo.md`)
- Browser validation completed against the live reference, differences resolved or explicitly documented (`visual-validation.md`)
- Lighthouse (or the environment's equivalent) actually run, with real measured scores — LCP/CLS/INP/TTFB considerations, images, fonts, JS, third-party scripts, and SEO fundamentals all checked (`eds-performance-seo.md`); any finding traced to a root cause and fixed there, not patched cosmetically
- Other pages using any shared component you touched were re-checked (Phase 7)
- Lint/typecheck/tests pass where the project has them
- No unrelated files changed

## Final report

After finishing a page or batch of pages, report concisely, covering:

**Pages** — implemented (routes) and validated.

**Measurements** — whether Phase 3.5 extraction was performed, which pages/components were measured, and at which breakpoints (see `references/measurement-extraction.md`).

**Components/blocks** — created (brief description), reused (and from where), new reference→implementation name mappings recorded.

**Responsive** — breakpoints tested (both the CSS authoring tiers and the device-width spot-checks from `eds-performance-seo.md`).

**SEO** — metadata (title/description/canonical/OG), semantic HTML, headings, links, sitemap/robots where applicable.

**Performance** — LCP/CLS/INP/TTFB considerations, image optimization, JavaScript minimization, third-party resources.

**Lighthouse** — report the actual measured results if it was run. **Never invent scores.** Example:

> Performance: 97, Accessibility: 100, Best Practices: 100, SEO: 100

If Lighthouse wasn't run, say so explicitly: "Lighthouse validation not performed."

**Remaining issues** — real known issues only (including environment limitations distinct from code defects, e.g. a local dev server not setting compression/cache headers that a real deployment would).

**Tests/typechecks/lint** — run and their result.

**Files changed.**

Don't declare a page "pixel-perfect" or "complete" without having actually run both the visual validation loop and Lighthouse — a page that renders without errors, or that scores well on one axis, is not the same as a page that's actually done.
