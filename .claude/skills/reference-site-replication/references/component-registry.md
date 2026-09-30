# Component registry

The component registry is the shared memory that makes reuse possible across a large site and across sessions. Without it, every new page — or every new conversation — starts from zero knowledge of what's already been built, which is how duplicate components happen.

## Where it lives

Create and maintain this file inside the **target project** (not inside the skill), e.g. `docs/component-registry.md` or wherever the project keeps this kind of reference documentation. If the project already has a similar doc (a Storybook, a design-system README), extend that instead of creating a second source of truth — link to it from here if needed.

## What to record per component

For every component (new or reused), record:

- **Reference component name** — the name found on the reference site, if reliably known (see `discovery-process.md`); otherwise "unknown — see note."
- **Implementation name** — the actual component name/file in the target codebase.
- **Description** — what it does, in a sentence.
- **Reference URLs where found** — which reference pages it was observed on.
- **Pages where used** — which pages in the *target* project use it (this is what makes cross-page consistency checks possible before Phase 7).
- **Variants** — the distinct variants/props that exist and what each is for.
- **Props** — the actual prop/API surface, briefly.
- **Responsive behavior** — anything non-obvious about how it adapts across breakpoints.
- **Dependencies** — other components it composes or relies on.
- **Status** — `planned`, `in progress`, or `complete`.
- **JavaScript** — does it need JS at all, and if so how much (`none`, `minimal`, or a brief description)? See `eds-performance-seo.md`'s JavaScript performance section — this field exists to make "could this have been CSS-only" a visible, revisitable question, not a one-time decision.
- **Images** — does it load images, and is it a likely LCP candidate on any page it appears on?
- **CLS risk** — `low`/`medium`/`high`, based on dynamic content, late-loading assets, or animation (see `eds-performance-seo.md`'s CLS section).

## Format

Use a table for the common case, with notes below it for anything that doesn't fit in a cell. Extend the base columns with the performance ones from `eds-performance-seo.md`'s block-level evaluation:

| Reference Name | Implementation | Used On | Variants | JS | Images | LCP Risk | CLS Risk | Status |
|---|---|---|---|---|---|---|---|---|
| Header | Header | /, /about, /contact | sticky | minimal | No | Low | Low | complete |
| Hero | Hero | /, /about | image, video | none | Yes | High | Medium | complete |
| ContentCard | Card | /news, /insights | image/text | none | Yes | Low | Low | complete |
| Accordion | Accordion | /faq | default | minimal | No | Low | Low | complete |

(Drop the extra columns for a small, low-stakes build if they add more overhead than value — the point is to make performance-relevant facts about a shared block visible and auditable, not to force a fixed schema. Keep at minimum whichever columns actually inform a decision later.)

Add a short note block under the table for anything needing more detail than fits a cell, e.g.:

> **Card** — reference called this `ContentCard`; reused the project's existing `Card` component since it already supported an image+text layout. Added an `imagePosition` prop (`"top" | "left"`) to cover the reference's second layout. Depends on `Button` for its CTA slot.
>
> **Hero** — carries the LCP element on every page it's used on; its image is always `loading="eager"` with explicit `width`/`height`, never lazy-loaded. See `eds-performance-seo.md`'s Hero example.

## Maintenance rules

- **Update it as you discover, not just after building.** As soon as you notice a repeated structure during Phase 1 discovery, add a row (status `planned`) even before implementing it — this is what lets a later page (or a later session) find it instead of re-discovering it independently.
- **Check it before creating anything.** This is the first stop in the reuse-decision sequence in `naming-rules.md`.
- **Update status as work progresses.** A stale registry that says `complete` for something that's actually broken is worse than no registry.
- **Record reference→implementation name mappings even when they differ**, so the connection isn't lost (see `naming-rules.md` for when this happens).
- **When you add a variant to an existing component**, update its row rather than adding a new row for a "new" component — the variant is part of the same component's story.
- **If the project also keeps a per-component `metadata.json`** (see `naming-rules.md`), update it alongside the registry row, not instead of it — the registry stays the source of truth.
- **Re-evaluate the performance columns whenever a shared component changes**, not just when it's first built — adding an image to a component that previously had none, or adding a JS interaction to something that was CSS-only, changes its LCP/CLS/JS profile and is exactly the kind of drift this registry exists to catch before it's discovered the hard way in a Lighthouse run.
