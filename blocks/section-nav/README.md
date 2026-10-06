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

## Behavior

- The link of the section under the bar is marked active (scroll-spy).
- When the links don't fit on one row next to the CTA (measured, not a fixed breakpoint — on this page below ~880px), they collapse into a toggle labelled with the current section ("Overview" before any linked section). Opening it lists the other sections over a dimmed, blurred page; Escape, an outside click, or choosing a link closes it.
