# section-nav

Custom **section-nav** block. 

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: one row, one cell of content.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)

## Content model

| Row | Content |
|---|---|
| 1 | List of jump links, each href `#<id>` |
| 2 | CTA link (e.g. Contact Sales) |

Each target section needs a Section Metadata `Id` row matching the link anchor (e.g. `benefits`); clicks smooth-scroll to the element with that `data-id`.
