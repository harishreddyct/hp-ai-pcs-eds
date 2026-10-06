# cards

Custom **cards** block. 

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: one row, one cell of content.

## Supported variations

| Variation | Option class |
| --- | --- |
| Benefits | `benefits` |
| Portfolio | `portfolio` |
| Product | `product` |
| Feature | `feature` |

## Universal Editor fields

N/A (Document Authoring project)

## Content model

| Row | Cell 1 | Cell 2 |
|---|---|---|
| one per card | Image (icon for `benefits`) | Body: heading, text, optional CTA link |

- `benefits`: icon + text with bold lead-in, over a dark photo section background.
- `portfolio`: image, H3, copy, Learn link (3-up).
- `product`: centered product image, H3, CTA link (2-up).
- `feature`: landscape image-top tiles, H3 + copy, no CTA (4-up).
