# Conversion

The only list of how a post's elements reach LinkedIn. `scripts/extract.mjs` implements the "Script" column; when
this table changes, the script changes with it. None of these rows changes Adam's words.

| On the blog | Script (wave 1) | Wave 2 | In the report |
|---|---|---|---|
| Paragraphs, headings, lists, quotes, links, emphasis | Kept as they are | | Heading levels flatten to one style |
| Image (`{% image %}`, `<img>`, `![]()`) | `[[IMAGE n: alt]]`, kind `file` | Original file from `_src/assets` | |
| Gallery (`{% gallery %}` with `{% galleryImg %}`) | One placeholder per image, in order | One image each, full size | Galleries become single images |
| Mermaid diagram (`<pre class="mermaid">`) | `[[IMAGE n: diagram k]]`, kind `mermaid` | Screenshot `.linkedin/<post-name>/diagram-k.png` | Diagrams shown as images |
| Table | `[[IMAGE n: table k]]`, kind `table` | Screenshot `.linkedin/<post-name>/table-k.png` | Tables shown as images |
| Code block | Text kept, highlighting markup removed | | Code loses syntax highlighting |
| Collapsible section (`<details>`) | Summary becomes a paragraph, content always visible | | Collapsibles shown open |
| Internal link (`/posts/...`) | Rewritten to `https://data-integration.dev/...` | | Internal links made absolute |
| Contact or schedule button, "Click to open" under a gallery | Removed: site widgets, not text | | Buttons left out |
| Title and date above the post | Removed from the body; the title is typed into LinkedIn's title field | | |

## Added

One line above the body, then a horizontal rule: the `attribution` sentence from [wording.md](wording.md), with the
post's address as a link. Nothing is added below the body.

## A screenshot that can't be made

Leave its placeholder in the draft and report it under "Needs your attention". Adam decides what goes there; the
skill never writes a replacement sentence, because nothing may be added to his text.

## An element not in the table

Stop before wave 1 and show it to Adam with the post and the line. Propose a new row here and the matching change
in `extract.mjs`; apply both after he agrees. Don't improvise a conversion in the browser.
