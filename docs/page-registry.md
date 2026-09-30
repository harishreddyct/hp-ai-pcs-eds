# Page registry

| Path | Reference URL | Status | Notes |
|---|---|---|---|
| `/` | https://www.hp.com/us-en/ai-solutions/next-gen-ai-pcs.html | Built | Full single-page recreation; see `measurements-next-gen-ai-pcs.md` for content inventory and recorded simplifications. |
| `/nav` | HP global header (simplified) | Built | Fragment consumed by the `header` block. |
| `/footer` | HP global footer (simplified) | Built | Fragment consumed by the `footer` block. |

Only one content page exists in this project so far. If more HP pages are
added later, check this file and `component-registry.md` before creating
any new block — most sections of a second AI-PC-adjacent page are likely
to reuse `cards`, `columns`, `promo`, and `accordion` rather than needing
new components.
