# Discovery process

Two discovery passes happen before any implementation code is written: understanding the project you're building into, and understanding the reference site you're replicating. Skipping either one is the single biggest cause of wasted rework on this kind of task — building against the wrong architecture, or against a misread of the reference, means redoing pages later.

## Phase 0 — Project discovery (the existing repository)

Read enough of the target codebase to answer each of these before writing anything:

- **Framework** — React/Next, Vue/Nuxt, Astro, plain HTML/CSS, etc. Check `package.json`, config files, and the file layout.
- **Routing structure** — file-based routing, a router config, or static pages? Where do new routes/pages get added?
- **Package manager** — npm, pnpm, yarn, bun — check the lockfile present, don't assume.
- **Styling solution** — Tailwind, CSS Modules, styled-components, Sass, vanilla CSS, a CSS-in-JS library. Look at how existing components are styled, not just what's installed.
- **Component structure** — where do components live, how are they organized (by feature, by type, atomic-design layers), what's the file-naming convention (`Header.tsx`, `header.component.tsx`, `Header/index.tsx`)?
- **Design system** — is there a token file, theme config, or design-system package already defining colors, spacing, type scale? This should become the source of truth for new components, not values eyeballed from the reference site.
- **Existing shared components** — enumerate what's already built (a `Button`, `Card`, `Header`, etc. may already exist and just need reuse or a new variant). For an EDS project, the concrete version of this is `ls -d blocks/*/` — a direct folder scan is ground truth and takes one command; don't rely solely on the component registry doc, which can go stale.
- **Existing utilities** — helper functions, hooks, layout primitives already available.
- **Existing assets** — logo files, icon sets, image directories already vendored — prefer these over fetching fresh copies when they're the same asset.
- **Typography** — font families/loading strategy, heading scale, already defined somewhere (Tailwind config, CSS variables, a typography component).
- **Breakpoints** — this skill builds mobile-first on a fixed scale: base (unscoped/mobile), then `min-width: 768px`, `min-width: 960px`, `min-width: 1200px`. Confirm any existing breakpoint tooling (Tailwind config, theme helpers) resolves to this same scale rather than assuming — see `references/responsive-rules.md` for the full mobile-first methodology. Don't adopt a different breakpoint scale from the reference site itself; map its behavior onto these four states instead.
- **Coding conventions** — linting/formatting config, naming patterns, import ordering.
- **Accessibility conventions** — existing patterns for focus states, ARIA usage, semantic structure.
- **Testing setup** — is there a test runner, visual regression tooling, or Storybook already in place? If so, new components should fit into it.

Do not introduce a new framework, styling system, or component architecture "because it seemed cleaner" — the requirement is to replicate the reference site's *appearance and behavior*, not to also re-architect the target project. If the existing architecture genuinely cannot support something the reference site needs (e.g. no way to do client-side interactivity at all), say so explicitly before making the change (see Change Control in SKILL.md) rather than silently switching approaches.

**If the target project folder already contains a different, unrelated in-progress build** — e.g. a previous replication attempt against a different reference site — don't assume what to do with it. Ask whether to replace it, keep it alongside and only share truly identical pieces (like a generic `Button`), or build in a different location. Treating leftover work from an unrelated site as "the existing architecture" to extend is a common way to end up with components named after the wrong reference.

### Full project scaffold checklist (starting a fresh EDS project)

This checklist applies when Phase 0 finds nothing to build into **and** the chosen stack is Edge Delivery Services — either because the user asked for it, or because it's clearly implied (e.g. the reference site is itself EDS-based and the user wants the same platform). It is not the default for every "nothing exists yet" case: if no stack has been specified and none is implied, ask which one to scaffold before proceeding, the same as you would for any other framework choice. For a non-EDS stack, scaffold using that stack's own normal conventions (a fresh Next.js/Vite/Astro/etc. project via its standard tooling) rather than adapting this checklist to fit.

When EDS is the confirmed target, a complete project has more than just `blocks/`, `scripts/`, and `styles/`. Use this as the checklist, adapting names/tools to whatever the project's own conventions turn out to be once something exists to check against:

- **Root config**: `package.json`, an ESLint config (+ `.eslintignore`) — if `package.json` sets `"type": "module"`, this must be `.eslintrc.cjs`, not `.eslintrc.js`: ESLint's own config loader uses `require()`, and Node treats a plain `.js` file as ESM under `"type": "module"`, so `.eslintrc.js` fails to load with a "module is not defined" error in that setup (confirmed directly — don't assume the `.js` extension is safe without checking `package.json`'s `type` field first), `.stylelintrc.json`, `.editorconfig`, `.gitignore`, `.hlxignore` (excludes non-published folders like `docs/` and `tools/` from what the EDS pipeline serves), `.renovaterc.json` (or equivalent dependency-update config).
- **Root docs**: `README.md` (install/serve/lint instructions), `AGENTS.md` (project structure and conventions for future agent sessions — see the aem-boilerplate/aem.live convention for the shape of this), `CLAUDE.md` (a one-line pointer to `AGENTS.md`, not a duplicate), `LICENSE`, and — if the project might ever take outside contributions — `CONTRIBUTING.md` / `CODE_OF_CONDUCT.md`.
- **Root site files**: `head.html`, `404.html` (+ its own `404.css` rather than inline styles), `helix-query.yaml` (or the platform's equivalent indexing config) if the reference platform uses one.
- **`scripts/`**: the platform's core decoration library (e.g. `aem.js` — never modify this one), the page-decoration entry point (`scripts.js`), and a deferred/low-priority entry point (`delayed.js`).
- **`styles/`**: global mobile-first styles required for first paint, a separate font-face file, and a lazy/below-the-fold stylesheet — don't merge these into one file even though nothing stops you; splitting them is how the platform defers non-critical CSS.
- **`blocks/{name}/`**: `{name}.js` + `{name}.css` per block, as already covered above — plus, if the project's own convention calls for it, a `metadata.json` alongside them (name, description, group, pages using it, variants, status) mirroring what's in the component registry in a form other tooling can read block-by-block. Keep it in sync with the registry rather than treating it as a second source of truth.
- **`fonts/`, `icons/`, `images/`**: three separate asset folders, not one — `icons/` for small UI SVGs referenced by blocks, `images/` for content photography, `fonts/` for vendored webfont files. When a real font/icon/image can't be sourced yet, drop a short README in the folder documenting what's expected there rather than leaving it a silent gap.
- **`tools/`**: local dev tooling (block scaffolding scripts, one-off migration helpers) that isn't part of the shipped site — excluded from publishing via `.hlxignore`.
- **`docs/`**: the component and page registries (see `component-registry.md` / `page-registry.md`).

Never hand-write a file that's supposed to be generated (a lockfile, a build manifest) — run the real install/build command instead, or leave it explicitly as an outstanding step if the tooling to generate it isn't available.

### When the EDS project is deployed with real Document Authoring (DA), not just scaffolded locally

If the project goes further than local scaffolding — content is actually being pushed to a real DA-backed site (`da.live` + `admin.da.live` + `admin.hlx.page`) — several non-obvious operational behaviors are worth knowing before they cost a debugging cycle. **Before any of this, read `references/da-content-silent-failures.md`** — eleven specific ways authored content or an API call can silently do the wrong thing (or nothing) with zero error surfaced, verified against Adobe's own DA/EDS content reference rather than left to be independently rediscovered per project.

- **`admin.da.live` (content storage) and `admin.hlx.page` (preview/publish triggers) can require differently-scoped tokens even from the same logged-in session.** A bearer token extracted from a request to one can succeed there (`PUT .../source/...` → 200) while failing on the other (`POST .../preview/...` → 401) — they're different services under the same login, not interchangeable just because both came from da.live. If a content push reports success but the page never updates, check whether the *preview-trigger* call specifically is the one failing, and if so, capture a token from a request made *to that exact host* (filter DevTools' Network tab for it) rather than reusing one grabbed from a different action. If token-hunting proves unreliable, using da.live's own UI (its file browser's bulk preview/publish action, if it has one) sidesteps the problem entirely — it authenticates via the browser's real session rather than a bearer token you have to extract and paste.
- **A bearer token extracted from browser DevTools has a limited lifespan and can expire mid-session** — don't assume a token that worked earlier in the same conversation is still valid; a sudden `401` on every request (not just one endpoint) after previously working is the signature of this, not a code regression.
- **The local dev server (`aem up` / `@adobe/aem-cli`) has no independent content store of its own.** It serves this repo's code from disk but *proxies actual page content from the deployed preview URL* — so "does it work locally" and "does it work on preview" are the same question with the same answer, not two independent things to fix separately. If content looks stale locally, the fix is pushing to DA/preview, never something local-only. Common `aem up` failure signatures, worth recognizing on sight rather than debugging from scratch each time:

  | Symptom | Cause | Fix |
  |---|---|---|
  | `EADDRINUSE: address already in use :::3000` | another `aem up` (possibly for a different project) already holds the port | `aem up --port <other>`, or find and confirm the other process before touching it (`lsof -i :3000`) — it may be someone else's in-progress work, not a stale leftover |
  | A path that works on the live preview 404s locally | wrong origin proxied | pass `--url https://<project>--<owner>.aem.page` explicitly rather than relying on the default |
  | `unable to get local issuer certificate` | a corporate HTTPS-intercepting proxy | `export NODE_EXTRA_CA_CERTS=/path/to/corporate-ca.crt` before running `aem up` |
  | A local-only draft file 404s even though the server is running | `--html-folder` wasn't passed | local HTML files are never served without it — pass `--html-folder <dir>` (or set `AEM_HTML_FOLDER` in `.env`) |
- **Pushing a change that touches `.github/workflows/*` can be silently rejected by GitHub even when every other file in the same commit pushes fine** — a `gh`-authenticated OAuth session without the `workflow` scope gets a specific `refusing to allow an OAuth App to create or update workflow ... without workflow scope` rejection for that path alone. Getting a working push means either the user granting that scope (`gh auth refresh -s workflow`, which needs their interactive approval) or holding that one file out of the commit until they can.

## Phase 1 — Reference discovery (the site being replicated)

For every reference URL supplied, inspect the live page rather than guessing from a screenshot alone. Use whatever browser automation is available (e.g. the Chrome browser tools) to load the real page, read its DOM and accessibility tree, and exercise its interactive states — a static screenshot cannot tell you about hover states, sticky behavior, or what happens at a breakpoint you didn't screenshot.

Identify, for each page:

- Header / primary navigation (and its mobile variant — hamburger menu, drawer, etc.), including whether it changes on **scroll** (shrinks, collapses a utility bar, swaps logo size, becomes fixed/sticky) — a scroll-triggered state is distinct from its breakpoint states and must be captured by actually scrolling the reference, not just viewing it at the top
- Hero / page banner
- Breadcrumbs
- Content sections (and how they differ page to page)
- Cards (article cards, product cards, content cards — note if there are multiple *distinct* card types)
- Forms and their validation/interaction states
- CTAs (buttons, banners, inline links styled as CTAs)
- Accordions / expandable sections
- Tabs
- Media (images, video, carousels) and how they're sized/cropped responsively
- Footer
- Pagination
- Sidebars
- Any other repeated UI you notice
- **Third-party resources** — analytics, ads, social widgets, video embeds, chat widgets, tracking scripts, external libraries. Check the page source/network requests, not just what's visually obvious (an embedded video is easy to spot; an analytics snippet or a chat-widget loader isn't). See `eds-performance-seo.md` for what to do with each once found — the default is not to reproduce them unless the reference's actual functionality needs it.
- **Fonts** — which families and weights are actually loaded (check `@font-face`/`<link>` font requests, not just what `font-family` the CSS declares), since this determines what needs to be reproduced versus what's just a fallback reference. See `eds-performance-seo.md`'s Fonts section.

Then step back across all the pages you've inspected and identify:

- **Repeated structures** — which of the above appear on more than one page with the same visual/behavioral pattern (this is your candidate component list)
- **Responsive behavior** — resize or use device emulation to see how each region adapts; don't infer mobile layout from desktop alone
- **Interactions** — hover states, focus states, open/closed states, transitions, anything observable without needing private source access
- **Component names**, when reliably available

### Collapsed, hidden, and interactive content reads as flat prose unless you probe for it

A plain text or DOM-text extraction of a **collapsed** accordion is indistinguishable from a flat list of headings followed by paragraphs — the questions are there, the answers are there, nothing in the extracted text says "this is an accordion." Confirmed directly: a reference FAQ page's seven questions shipped as always-open sequential prose against a reference that renders them as a collapsed accordion, because the discovery pass only read the extracted headings/paragraphs and never looked at *how they were wired*. Before concluding any region is static content, run an explicit interactivity probe on it, not just a text read:

- Query for the machinery of the common interactive patterns: `[aria-expanded]`, `[aria-controls]`, `[aria-selected]`, `[role="tablist"]`/`[role="tab"]`/`[role="button"]`, `<details>`/`<summary>`, `[hidden]`, and class names ending `--hidden`/`--collapsed`/`--active`/`is-open`/`is-closed`.
- Look for children with a **zero-size bounding box** (`getBoundingClientRect()` height 0, or `display:none`/`visibility:hidden` computed) sitting next to visible siblings — a collapsed panel, an off-screen drawer, an inactive tab pane.
- Actually exercise the state where you can: click/hover the candidate trigger and re-read the DOM, since the open state reveals both the interaction and any content that was hidden in the closed state.

A region that turns out to be interactive changes the component decision (a real block vs. plain default content) and the accessibility work (native `<details>` or an ARIA pattern vs. nothing) — it is not a detail to leave for the visual pass.

### A negative observation needs the same evidence as a positive one

"No accordion observed on the reference" was written into a component registry as settled fact with nothing behind it — no query, no interaction attempt — and it was simply wrong. Treat any "the reference does **not** have X" claim (no accordion, no carousel, no sticky header, no second breakpoint) as a claim that requires recorded proof exactly like a positive one does: note the selector query you ran or the state you exercised that established the absence. If you didn't actually probe for it, the honest registry entry is "not checked," not "not present" — a confidently-recorded false negative is worse than an admitted gap, because it stops anyone from looking again.

### Capture the page's layout skeleton, not just its component list

A component-by-component inventory answers "what pieces exist" but never "how are they arranged," so it structurally cannot catch a sidebar, a two-column split, or a reordered section — the arrangement isn't any one component's property. Confirmed directly: a "Need more help?" panel that the reference places in a fixed-width right rail at the top breakpoint (top-aligned beside the main content) shipped as a full-width block stacked at the very top of the page, because discovery recorded *that the panel existed* but never recorded *where it sat*. For every page, capture its top-level layout skeleton as its own artifact: walk the page's main content regions in document order and record each one's bounding box (x / y / width / height) at every required breakpoint, then diff that ordered set of boxes against the implementation's. This surfaces column/sidebar structure, content reordering across breakpoints, and off-to-one-side placement that a per-component check silently misses. Extend the skeleton all the way to the page edges: include the header→content and content→footer seams (the vertical gap above the footer is a real, often-uniform design value — measure it) and note any thin content-width divider the reference draws between the last content and the footer, recording *which* pages have it since it is frequently authored per-page rather than global.

The skeleton must record each region's **horizontal content inset (the left and right gutter), not just its vertical position and height** — the x/width of the box alone doesn't tell you whether the content hugs the screen edge or sits inside a comfortable margin, and a region whose gutter is a *fixed* value while the reference's *scales* with viewport will look correct at the one width you happened to check and hug the edges at every narrower one. Confirmed directly: the footer shipped with a fixed 16px side gutter and matched the reference at 1200px+ but hugged the edges at 1024px and below, where the reference keeps a ~28–32px gutter. Measure the left inset (content-left minus region-left) and right inset (region-right minus content-right) for header, each content section, and the footer, at *every* required breakpoint, and diff each against the reference — a full-bleed dark footer bar makes an under-sized gutter especially obvious, but the same drift can hide anywhere.

### A hero/banner caption that overlaps the image belongs to the hero block, not to a section below it

When the reference shows a heading + intro paragraph sitting on a white (or tinted) card that **overlaps the bottom of a hero/banner image** (pulled up over the image via a negative margin, so the card straddles the image edge), that text is the hero's own *teaser caption*, authored as part of the hero — not a separate content section that happens to follow the hero. Confirmed directly: the adventures page's "Experience the world with us" intro shipped as a standalone flat-text section below an image-only hero, when the reference renders it as the hero teaser's overlap card (measured ~1192px wide, white background, its top sitting up over the hero image). The tell is the **vertical overlap** in the layout skeleton: if a text block's top y is *above* the previous image region's bottom y, they are one composed unit, not two stacked regions. During discovery, when a hero is followed closely by a short heading+paragraph, check for this overlap explicitly and, if present, record the caption as part of the hero (author the image and the caption text in the same hero row/slide) rather than as the next section.

### Sources for component names

Reliable sources, roughly in order of trust:

1. **DOM information** — `data-component`, `data-testid`, BEM-style class names, or other attributes that name the component directly. On an Edge Delivery Services (EDS) reference site specifically, `data-block-name` is set automatically by the platform's own decoration code (never hand-authored), which makes it the single most reliable name source available — see below.
2. **Accessibility information** — ARIA roles/labels sometimes reflect the component's semantic identity (less reliable for naming, more useful for structure).
3. **Visible labels** — text the page itself uses to describe a section (e.g. a CMS-rendered "Related Articles" heading suggests a `RelatedArticles` component, though this is inference, not proof).
4. **CMS metadata** — if page source, meta tags, or a public API expose block/component type names.
5. **Existing project conventions** — if the target codebase already replicated part of this same source system, its existing names take precedence for consistency.
6. **Source information available through authorized tooling** — e.g. a connected design tool exposing real component names, or the reference's own public source repository (see below).

If none of these reliably yield a name, do not invent an "official-sounding" one. Use a plain semantic name based on what the component *does* (e.g. `FeatureGrid`, `TestimonialCarousel`) and record in the component registry that this name is Claude's own, not the reference site's.

### When the reference is itself an EDS or other open-source project

If the reference site is itself built on Edge Delivery Services (or any platform where the source is publicly available, e.g. a public GitHub repo), discovery gets much more reliable than reading rendered output alone:

- **Check the reference's own `AGENTS.md`, `CLAUDE.md`, and `README.md` first.** These often state the project's exact breakpoints, folder structure, and conventions directly — ground truth, not inference. Don't skip this in favor of reverse-engineering the same facts from screenshots.
- **Enumerate live block names via JavaScript, not by eyeballing class names.** Running `[...document.querySelectorAll('[data-block-name]')].map(b => b.dataset.blockName)` in the page's own console (or a browser-automation JS-execution tool) reads the attribute the platform itself sets — far more reliable than guessing from CSS classes, and it directly gives you the reference name for every block on the page in one call. Pair it with a query on `main > .section` (classes, contained block names, headings) to map which blocks belong to which section and to spot sections that carry no block at all (plain default content — don't force one into a component).
- **Fetch the actual source files** (e.g. via a raw-file host like `raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}`, or directly over HTTPS if the reference is a public live site) rather than reconstructing a block's CSS/JS from rendered behavior. This reveals real breakpoints, real design-token values, and real dependencies (e.g. a `header` block that internally depends on a `fragment` block to load nav content) that would otherwise have to be guessed. Note that a hosted git provider's tree/directory-listing API endpoints can be unreliable to fetch directly even when individual file paths fetch fine — if a full listing isn't available, confirm file paths individually (via search, via links found in already-fetched source, or via the platform's own README) rather than guessing folder contents wholesale.
- **Fetch every stylesheet the reference actually loads, not just the obvious main one.** An EDS-style site typically splits CSS across at least three files (an eager `styles.css`, a `fonts.css`, and a lazily-loaded `lazy-styles.css` or equivalent) — the "below-the-fold"/lazy one is easy to skip because it isn't linked in `<head>`, it's fetched by a `loadCSS()` (or equivalent) call inside the JS itself, often well downstream of `loadEager`. Read the entry-point JS (`scripts.js` or similar) specifically looking for every dynamic stylesheet load, fetch each one, and diff it with the same rigor as the main stylesheet. A lazy stylesheet often carries real, load-bearing rules (webfont `@import`s, a whole section's styling) that never show up if only the linked `<head>` stylesheet gets checked — treat "I checked styles.css" and "I checked every stylesheet the page loads" as different, non-substitutable claims.
- **Fetch the actual page source (the pre-decoration authoring HTML, or equivalent) for every page being replicated, and treat it as the literal ground truth for content, item counts, and structure** — never paraphrase, invent, or guess page copy, list lengths, or how content is split across block instances when the real source is fetchable with a plain HTTP request. If something about content structure can't be determined without fetching it (e.g. "does this section use one block instance or two, and how does content divide between them"), fetch it before implementing rather than implementing a best guess and merely noting the guess in the registry — a documented guess still ships as visibly wrong content; go get the real answer instead. Only fall back to a flagged, documented placeholder when the source genuinely isn't obtainable (private/restricted/paywalled), not when it's simply one more fetch away.
- **This applies equally to shared fragments, not just "pages" in the obvious sense** — nav content, footer content, and any other global include (an EDS site's `nav.plain.html`/`footer.plain.html` or equivalent) is exactly as fetchable and exactly as easy to under-verify as a full page, precisely because it feels like a small, secondary thing. Diff it character-for-character against the reference's real fragment source (markup structure, wrapping tags, attributes like `title`) rather than reconstructing it from a rendered screenshot or a generic boilerplate pattern.
- **A block confirmed to exist in source but not reachable from any page you've found** (no link to it anywhere in the nav or content you've discovered) is a real, common case — e.g. an RSVP/confirmation form block meant to be sent as a private link. Don't invent a page or URL for it. Record it in the component registry as a documented gap (found in source, no known page) rather than either building a page to showcase it or silently omitting it from the registry.
- **Before deciding a block doesn't exist or is out of scope, confirm it by directly probing its expected file path** (e.g. `GET /blocks/{name}/{name}.css`) rather than inferring non-existence from a class name never being spotted in rendered output — a block can be real, fully built in source, and simply not linked from any page you've crawled yet (see above).

### Discovery finds structure; Phase 3.5 measures values

Phase 1 identifies **what** exists — the components, regions, interactions, names, and repeated patterns. It does not, by itself, capture **how** those things are sized, spaced, and styled (exact `padding`, `margin`, `font-size`, gutter, seam, layout-box dimensions). Those concrete numbers are extracted in Phase 3.5 — see `measurement-extraction.md`. Don't conflate the two: a component inventory with no measured values is not yet a build spec, and building from the inventory alone is how eyeballed, close-but-wrong spacing/type gets shipped. Discovery tells you the hero exists and carries the LCP image; measurement tells you the hero heading is 44px/700/rgb(0,62,126) with a 0.5em top margin.

## Multi-page workflow

On a site with many pages, run discovery across the whole set before building anything, so shared components are identified once rather than being "discovered" independently on every page (which is exactly how duplicate components happen).

1. **Discover pages** — enumerate the URLs/routes to be replicated and note each one's purpose.
2. **Discover shared components** — compare structural regions across all discovered pages; anything appearing on 2+ pages with consistent structure is a shared-component candidate.
3. **Build foundational/shared components** — header, footer, and anything else used broadly, built once.
4. **Build page-specific components** — pieces genuinely unique to one page.
5. **Assemble pages** — compose shared + page-specific components; a page's own file should mostly be composition, not large duplicated markup.
6. **Validate responsive behavior** — per `references/responsive-rules.md`.
7. **Run cross-page consistency checks** — confirm shared components still behave correctly on every page that uses them.

Worked example: if Page A uses Header, Hero, ContentCard, Footer; Page B uses Header, ContentCard, Accordion, Footer; and Page C uses Header, ContentCard, Quote, Footer — the implementation should end up with exactly six components (Header, Hero, ContentCard, Footer, Accordion, Quote), with Header, ContentCard, and Footer each reused across all three pages. Not three separate ContentCard variants named after the pages they happen to appear on.

## Cross-page consistency (ongoing, not just at the end)

Whenever a shared component is about to be modified:

1. Check the component registry for every page/variant that uses it.
2. Check its documented variants and props.
3. Identify which pages are affected by the change.
4. Preserve existing behavior for pages that don't need the change, unless the reference site itself shows they should also change.
5. After modifying, revalidate the affected pages (not just the one that prompted the change).

A page-specific fix that isn't scoped this way is the most common way a shared-component change silently breaks an unrelated page.
