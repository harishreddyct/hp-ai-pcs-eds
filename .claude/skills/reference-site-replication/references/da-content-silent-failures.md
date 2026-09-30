# DA content: silent-failure rules

When a project's content is actually authored/pushed through Adobe Document
Authoring (DA, da.live) rather than only scaffolded locally, a whole class of
mistakes produces broken content with **no error** from DA, the pipeline, or
the renderer — the code and a local static render both look correct; only
the deployed, authored page reveals the break. This project already
discovered one of these the hard way (see the "DA authoring round-trip
constraint" in this project's own `AGENTS.md` — a non-row-shaped block
losing its custom class on round-trip). The rules below generalize that
lesson and add the others, adapted from Adobe's own `da-content` reference
skill (`adobe/skills` repo) so they don't each have to be independently
rediscovered per project. Verify these in generated output *before* pushing
to DA, not after a page renders wrong.

1. **DA HTML is a body fragment.** No `<!DOCTYPE>`, `<html>`, `<head>`,
   `<script>`, `<style>`, or inline `style=` attributes — the pipeline
   injects head/scripts/styles from the code branch at delivery. Any of
   these present in authored content is either stripped or breaks silently.
2. **Block class encodes block identity.** The outermost `<div>` of a block
   carries `class="<block-name> [<variant>…]"` (or the accepted table-form
   alternate: `<tr><td colspan="N">Name</td></tr>` header, `N` matching the
   widest content row's cell count, omittable for single-column blocks). A
   missing div class, a wrong `colspan`, or an empty header cell makes the
   block render as plain HTML with **no** JS or CSS applied — no error,
   just a plain, unstyled block.
3. **Block names use alphanumeric + single hyphens only.** No underscores,
   no double dashes, no digit-first names. Variants are extra class tokens
   after the name (div form) or parentheses after the name (table form) —
   both normalize the same way.
4. **The Page Metadata block name must be exactly `metadata`** (div:
   `class="metadata"`; table: header text `Metadata`, case-insensitive).
   Any misspelling on either side is silently ignored — the page ships with
   no `<meta>` tags and no warning.
5. **Every `<img src>`/`<source srcset>` URL must be reachable from EDS's
   preview infrastructure.** Preview fetches and content-hashes each one to
   generate the delivered responsive `<picture>`; anything unreachable (DNS
   failure, 4xx/5xx, an HTML response instead of image bytes, timeout) or
   host-less (a bare repo-relative or document-relative path) renders as
   `<img src="about:error">` — this is the most common single cause of
   "images broken only after going through DA," and it's invisible until
   you actually look at the delivered `src`.
6. **Pre-uploading a binary to DA is only needed for URL stability**, not to
   reference it at all — any reachable URL gets sideloaded on first preview.
   Pre-upload when you want the asset immune to a third-party host changing
   or disappearing.
7. **The DA Source API requires `multipart/form-data` with field name
   `data`.** Any other field name (`file`, `image`, etc.) returns `200 OK`
   with nothing actually written — a successful-looking response that did
   nothing.
8. **Media has hard size caps**: SVG 40 KB, PNG/JPG/AVIF/WEBP 20 MB, MP4
   36 MB. An over-cap SVG specifically fails the preview step with a
   `409 AEM_BACKEND_FETCH_FAILED` ("Images N have failed validation") —
   check sizes before upload rather than after a failed preview.
9. **Preview and publish are required, separate steps.** Uploading content
   to DA does not make it visible at `aem.page`/`aem.live` on its own.
10. **Auth tokens expire silently** — a call that worked earlier in the same
    session can start failing with a bare `401` and empty body once the
    token lapses; treat a sudden, blanket `401` across every endpoint (not
    just one) as an expiry, not a code regression.
11. **Block cell content is normalized more aggressively than default
    content.** Inside a block's cells specifically, the pipeline rewrites
    `<b>`/`<i>`/`<s>`/`<mark>`/`<kbd>` to their semantic equivalents,
    strips `<span>` and `<ins>`, and applies positional rules to `<br>`.
    Visual styling survives, but a CSS selector targeting the original tag
    or a stripped wrapper class stops matching post-round-trip — this is
    the same *family* of bug as this project's own div/row/cell-shape
    finding (rule applies to inline tags inside a cell; the project's own
    finding applies to the cell/row wrapper shape itself), not a duplicate
    of it.

Treat rules 2 and 11 (and this project's own row/cell-shape finding) as one
category: **content that looks fine in a local static render can still be
silently reshaped or stripped by the authoring round-trip specifically** —
never call a block "done" from local/static verification alone once real DA
authoring is in the picture; push a real content sample through it and
check the delivered output (see `visual-validation.md`'s validation loop).
