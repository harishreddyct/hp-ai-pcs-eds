# Page registry

Companion to the component registry: tracks every reference page and its implementation status, so a multi-page replication effort can be picked up (by you, later, or by a teammate) without re-deriving what's already known.

## Where it lives

Create and maintain this file inside the **target project**, alongside the component registry — e.g. `docs/page-registry.md`.

## What to record per page

- **URL** — the reference URL.
- **Route** — the corresponding route/path in the target project.
- **Page purpose** — a one-line description of what the page is for.
- **Components used** — every shared and page-specific component the page composes (cross-reference the component registry).
- **Unique sections** — anything on the page that isn't a shared component and isn't expected to become one.
- **Responsive notes** — anything page-specific about how it behaves across breakpoints (most responsive behavior should live on the components themselves, but page-level layout quirks belong here).
- **Implementation status** — `not started`, `in progress`, `complete`.
- **Validation status** — whether the visual validation loop (`visual-validation.md`) has actually been run for this page, separately from implementation status. A page can be "implemented" and still "not validated."
- **SEO metadata** — whether `<title>`, meta description, canonical URL, and Open Graph tags have been checked against the reference for this specific page (see `eds-performance-seo.md`'s SEO section) — these are per-page facts, easy to get right on one page and forget on the next.
- **Lighthouse status** — whether Lighthouse (or the environment's equivalent) has actually been run for this page, and its real measured scores if so. Distinct from "validated," the same way implementation and visual validation are distinct — a page can be visually validated and still not have had a performance/SEO audit run against it.

## Format

| URL | Route | Components | Status | Lighthouse |
|---|---|---|---|---|
| https://example.com/ | / | Header, Hero, Card, Footer | complete | P:97 A:100 BP:100 SEO:100 |
| https://example.com/news | /news | Header, ArticleCard, Footer | in progress | not run |

Add a validation column or note block when it's useful to distinguish "built" from "checked against the reference" (visually and/or via Lighthouse):

> **/news** — implemented, not yet validated at 375px/390px; desktop and 1024px+ checked and matching. Lighthouse not yet run.

## Maintenance rules

- Add a row for every reference URL as soon as it's discovered (Phase 1), even before implementation starts, with status `not started`. This gives an accurate picture of scope for a large site.
- Update status as implementation and validation progress — the two are tracked separately because a page shouldn't be marked fully complete until both are done (see the validation checklist in `SKILL.md`).
- When a page reveals a new shared component partway through, add it to the component registry immediately and reflect it in this page's "Components used" list.
- Record real measured Lighthouse scores when run, never estimated or invented ones — if it hasn't been run yet, the field should say so, not be left blank in a way that could be mistaken for "not applicable."
