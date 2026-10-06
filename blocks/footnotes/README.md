# footnotes

Custom **footnotes** block. 

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
| 1 | Title, e.g. "Footnotes and Disclaimers" |
| 2 | Body: disclaimer paragraphs and/or a numbered list of footnotes (links allowed) |

Renders as one native `<details>/<summary>` panel, closed by default, with a +/- toggle and small gray small-print text. Title and body may also be authored side by side in a single row; if the title is omitted it defaults to "Footnotes and Disclaimers". Numbered items should match the `<sup>` markers used elsewhere on the page.
