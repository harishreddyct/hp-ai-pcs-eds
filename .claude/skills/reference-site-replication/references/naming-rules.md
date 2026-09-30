# Component naming and reuse rules

Naming and reuse decisions matter more than any individual pixel value — a beautifully accurate component that duplicates an existing one, or that's named `Page3Hero` instead of `Hero`, is a worse outcome than a slightly imperfect one that's correctly shared. This file governs those decisions.

## Before creating any component

Run through this sequence every time a new UI region looks like it might need a component:

1. **Search the existing repository.** Use the project's actual file structure (from Phase 0) — don't rely on memory of what you built earlier in the conversation. Grep for similarly-named or similarly-shaped components. For an EDS project specifically, the concrete, low-friction version of this is a plain folder scan — `ls -d blocks/*/` — run it directly rather than only inferring what exists from the registry doc.
2. **Check the component registry** (`component-registry.md` in the target project). It's the authoritative record of what's already been built or reused for this replication effort, including mappings from reference names. Treat it as the record of *intent and history* (why something was reused, named, or split) — the registry can go stale (a block renamed or removed without updating it); the folder scan from step 1 is the ground truth for what actually exists on disk right now. If the two disagree, that's a bug in the registry to fix, not a reason to trust the doc over the filesystem.
3. **Ask whether an existing component already provides the same responsibility** — not "does it look identical" but "does it serve the same role and accept the same kind of content." A card that shows an image, title, and link is the same responsibility whether the image is square or 16:9 — that's a variant, not a new component.
4. **Reuse the existing component if it's equivalent.** Add a prop or variant if the existing component almost fits but needs a small extension.

Only create a new component when the answer to step 3 is genuinely no — the structure, behavior, or content model is actually different, not just visually different in a way a prop could express.

**Before authoring any content into a component (new or reused), verify its exact expected authored HTML shape first — don't assume one and find out it's wrong only after content goes through the real pipeline.** For an EDS project under a content-authoring-platform round-trip (DA or equivalent), this matters concretely: some authored shapes (a native `<ol>`/`<ul>` or plain text sitting directly in a block wrapper, a bare element next to a div-wrapped sibling) silently lose custom classes/attributes on the round-trip, while the "table block" convention (row divs, each containing at least one cell div) survives. Confirm the shape a component's own `decorate()` function expects by reading it directly, or by finding an existing authored instance of the same or a structurally similar component already working in this project — rather than guessing a shape and discovering the mismatch only when real content is pushed through authoring and comes back stripped. Getting this wrong is expensive to diagnose after the fact (the code and the local static render both look correct; only the deployed, authored page reveals the break), so check it before writing any content, not after.

## Preserving reference names

If the reference site exposes a reliable component name (see `discovery-process.md` for what counts as reliable — DOM attributes, CMS metadata, etc.), preserve that name in the implementation where it's a reasonable fit for the target project's naming conventions. E.g. a reference `ArticleCard` should become an `ArticleCard` in the new project, not `Card3` or `NewsBlock`.

**When the reference name conflicts with an existing project component**, don't blindly rename the existing one to match. Instead, check whether they're functionally equivalent:

- If yes: reuse the existing project component, and record the mapping in the component registry, e.g.

  | Reference Name | Implementation |
  |---|---|
  | ContentCard | Card |

  so future work knows `ContentCard` on the reference site corresponds to the project's existing `Card`.

- If no (they're equivalent-looking but behave differently, or the existing component is scoped to a different use case): keep them as two distinct components, and note in the registry why they weren't merged.

**Never invent that a component has a particular "official" name** when you can't reliably determine one from the sources in `discovery-process.md`. A guessed name that sounds authoritative is worse than an honest semantic one, because it implies a certainty you don't have. Use a plain descriptive name and note in the registry that it's Claude's naming, not the reference site's.

## The core anti-pattern: page-prefixed duplicates

Never create:

```
Page1Hero
Page2Hero
Page3Hero
```

when all three are visually and structurally the same reusable component with different content. Create:

```
Hero
```

and reuse it, passing different content/props per page. This applies even when the three heroes have minor differences (different background treatment, different CTA count) — express those as variants or props on one component:

```
Hero (variant="image" | "video", ctaCount={1|2})
```

not as three separate components. Only split into genuinely separate components when the structure or behavior differs in a way props can't reasonably express (e.g. one "hero" is actually a full-width video player with custom controls and the others are static — that's a real difference, not a variant).

## Reuse detection when implementing a new page

1. Compare the new page's sections against the component registry.
2. Search the existing codebase for anything matching.
3. Reuse matching components as-is where possible.
4. Add a variant/prop to an existing component when the new page needs a close-but-not-identical version.
5. Create a new component only when the behavior or structure is genuinely different from everything already in the registry.

Do not duplicate a component simply because it appears on a different page — that's the default case this whole process exists to prevent.

**The same applies within a single page, not just across pages.** If a component appears twice in one section holding genuinely different content — e.g. one instance of a generic content-tile block holds a chronological news list and a second instance of the *same* block holds an unrelated sidebar CTA — that's still one component used twice, not two components. The content differs; the structure and behavior don't. Resist the pull to invent a second, more specifically-named component just because the two instances don't look interchangeable at a glance.

**A component confirmed to exist (in source, or referenced by another component) but not used on any page you've actually found** — e.g. a form block whose code you've read but that isn't linked from anywhere in the discovered nav or content — still gets a registry entry, marked as implemented-but-unlinked (or not-yet-implemented, your call) with a note on where it was found. Don't invent a page to showcase it and don't silently drop it from the registry either; both make the registry lie about what's known.

## Page architecture

Keep three things separate in the codebase:

1. **Shared components** — used by 2+ pages, or clearly intended to be (e.g. a design-system primitive). Live in the project's normal shared-component location.
2. **Page-specific components** — genuinely unique to one page. Still worth extracting into their own component if the page composition would otherwise be a huge block of markup, but don't over-engineer reusability that doesn't exist yet.
3. **Page composition** — the page file itself. It should primarily assemble shared and page-specific components with the right content/props, not contain large duplicated UI implementations inline.

Example layout (adapt to the target project's actual conventions from Phase 0 — this is illustrative, not prescriptive):

```
components/
  Header/
  Footer/
  Hero/
  Card/
  Accordion/
  Quote/

pages/
  home/
  about/
  services/
  contact/
```

If a page's file is mostly markup rather than mostly composition, that's a signal something that should be a shared or page-specific component is instead being duplicated inline.

### Per-component metadata alongside the registry

Some projects keep a lightweight `metadata.json` next to each component's own files (name, description, group, pages using it, variants, status) in addition to the central component registry. This is fine and can help tooling that reads component folders directly rather than a central doc — but treat the registry as the source of truth and the per-component file as a mirror of it. If they ever disagree, that's a bug to fix, not a sign the per-component file is now authoritative.
