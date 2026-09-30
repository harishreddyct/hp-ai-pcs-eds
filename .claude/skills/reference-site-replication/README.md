# reference-site-replication (portable skill)

A Cursor/Claude Agent Skill that drives a structured process for recreating an
existing website from reference URLs — discovering the reference's component
system and page architecture first, then implementing the target as a
maintainable set of shared, reusable components rather than one-off page copies.

**This skill is project-agnostic.** Nothing in it is tied to any single
codebase: it uses generic examples (`example.com`, `Header`/`Hero`/`Card`), and
every project-specific fact (framework, routing, styling, existing components,
design tokens) is discovered per project in Phase 0. Adobe Edge Delivery
Services (EDS) is the documented *default* to reach for when scaffolding a fresh
project, but Phase 0 always governs the real target architecture, and non-EDS
stacks (Next.js, Astro, Vue, plain HTML/CSS, etc.) are explicitly supported.

## Using it in a new project

1. Copy the entire `.claude/skills/` folder into the new project's root
   (so the new project has `.claude/skills/reference-site-replication/`).
2. That's it — no configuration. The skill auto-activates when you ask the
   agent to recreate/clone/replicate a site or add a page that must match a
   reference already being replicated.

Nothing needs editing on copy. The skill reads the *target* project during
Phase 0; it doesn't carry assumptions from the project it was copied from.

## What's in the folder

| File | Purpose |
| --- | --- |
| `SKILL.md` | Entry point: the phased workflow (Phase 0 through 8, including the measure-before-build Phase 3.5), quality bar, and cross-cutting engineering discipline. Read first. |
| `references/discovery-process.md` | Phase 0 (understand the target repo) + Phase 1 (inspect the reference site); name sources; multi-page workflow. |
| `references/naming-rules.md` | Component naming and reuse decisions; the page-prefixed-duplicate anti-pattern. |
| `references/measurement-extraction.md` | Phase 3.5: extract the reference's real dimensions, typography, spacing, layout skeleton, and content inventory **before** building — the build spec. |
| `references/responsive-rules.md` | Mobile-first methodology and the fixed 768/960/1200 breakpoint scale. |
| `references/component-registry.md` | How to build/maintain the component registry **in the target project**. |
| `references/page-registry.md` | How to build/maintain the page registry **in the target project**. |
| `references/eds-performance-seo.md` | Core Web Vitals, image/font/JS/CSS budgets, SEO, Lighthouse pass. |
| `references/visual-validation.md` | The compare-against-reference loop, exhaustive measurement audit, accessibility. |

The `references/` files are loaded on demand by the agent when it reaches the
relevant phase — they don't all need to be in context at once.

## Reference files vs. the registries you create (important)

There are two different things that share the "registry" name, and they live in
two different places:

- `references/component-registry.md` and `references/page-registry.md` (in this
  skill) are **permanent guidance** — the instructions for *how* to keep those
  registries. They stay in the skill folder unchanged and are copied as-is to
  every project.
- The **actual filled-in registries** for a build are created fresh **inside the
  target project**, e.g. `docs/component-registry.md` and
  `docs/page-registry.md` (or wherever that project keeps such docs). These hold
  the real component/page inventory for that one site.

So you never edit the skill's `references/*` to record a project's components —
those recordings go in the target project's own `docs/`. This is what keeps the
skill copyable without dragging one project's inventory into the next.

## Project requirements

The skill assumes only that the target project can be previewed locally and that
browser-automation / Lighthouse tooling can be added to it as real
`devDependencies` (or invoked via `npx` if the user doesn't want them
installed — see `references/visual-validation.md`). Validation tooling is always
installed into the project being built, never borrowed from a sibling project.

## Should `.claude/skills/` be committed?

Commit it to each project's repo. The skill is generic, but committing it means:

- every contributor and every agent session on that repo gets the same process,
- the reused copy is versioned alongside the code it helped produce.

The filled-in registries (`docs/component-registry.md`, `docs/page-registry.md`)
are also committed — they're real project documentation. Screenshot/scratch
output from the validation tooling (e.g. `tools/**/output/`) is what belongs in
`.gitignore`, not the skill or the registries.

## First-use checklist (per new project)

- [ ] `.claude/skills/reference-site-replication/` copied into the project root
- [ ] Phase 0 run: framework, routing, styling, existing components, tokens, and
      breakpoints of *this* project identified before writing code
- [ ] Registries created in the project's own `docs/` (not in the skill folder)
- [ ] Validation tooling added as this project's own `devDependency` (or wired
      via `npx`), with any driver script checked into the project's `tools/`
