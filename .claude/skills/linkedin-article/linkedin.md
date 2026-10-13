# LinkedIn in Chrome

Browser facts for LinkedIn's article editor. It is the only copy: `linkedin-teaser` reads this file too. The skill
updates it by itself when a run proves something changed, with a date. Facts dated 2026-10-13 come from a trial on a
draft that was never published.

## Addresses

| What | Address |
|---|---|
| New article | `https://www.linkedin.com/article/new/` |
| Existing draft | `https://www.linkedin.com/article/edit/<id>/` (the address changes to this once the draft is saved) |
| Adam's posts | `https://www.linkedin.com/in/adam-tetz/recent-activity/all/` (`/in/me/` shows an empty list) |

## Editor

- Title field on top ("Title"), body below ("Write here. You can also include @mentions."). The body is one
  editable area with class `ProseMirror`, label "Article editor content".
- Save state is shown bottom right: "Draft - saving", then "Draft - saved". Wait for "saved" before reading back.
- Toolbar: Style, bold, italic, lists, quote, code block, divider, link, embed, image. Top right: Manage, Next.

## Pasting (proven 2026-10-13)

- Cmd+V of rich text from the system clipboard keeps headings, links, emphasis, lists, quotes, code blocks and
  plain `[[IMAGE n: alt]]` lines. The paste lands at the cursor.
- Cmd+V of an image from the clipboard over a selected line replaces that line with the image. It shows as a
  `data:` image first and is served from `media.licdn.com` after the draft is saved and reloaded.
- Select a placeholder by finding its text and triple-clicking it.
- Copying on a web page with Cmd+C through the browser tool does **not** fill the clipboard. Always fill it locally
  with `scripts/clip-html.sh` or `scripts/clip-image.sh`.
- Cmd+Down does not move the cursor to the end of the article.
- LinkedIn turns both `h2` and `h3` into the same heading style, drops the code language, and flattens a pasted
  table into one line of text.
- If HTML with image addresses is pasted, only the first 20 images arrive and the rest vanish without an error.
  Not relevant to the two-wave method, which pastes no image addresses.

## Reading the page

Read-only script is allowed and is the reliable check. Useful reads on `.ProseMirror`: number of child blocks,
number of `figure` elements, `img` hosts, the text matches of `/\[\[IMAGE \d+/g`, and
`innerText.replace(/\s/g, "").length` for the fingerprint. Image blocks add the words "Minimize image", "Edit
image" and "Delete image" to `innerText`, so take the fingerprint after wave 1, before any image is placed.

Proven 2026-10-13: after wave 1 the editor's count equals the script's `fingerprint_chars` exactly. For the final
check, count `textContent` of a copy of the body with its `figure` elements removed: it equals `fingerprint_chars`
minus the length of the placeholders that were replaced.

## Cover (2026-10-13: no working method)

The cover area shows "Upload from computer", which opens a file dialog the browser tool can't operate. No file
input exists in the page before that button is clicked, and pasting an image with the cover area clicked does
nothing. Until a method is found, leave the cover empty and report it: Adam sets it with one click in the draft.

## Publish box (proven 2026-10-13, used only by linkedin-teaser)

- Next opens a box: "Tell your network what your article is about…", the article as a card, a clock (schedule)
  and Publish. Publishing sends the article and that text out together as one feed post.
- Closing the box with X asks "Discard draft?" with "Go back" and "Discard". Use "Go back"; never "Discard".
- With the box open, leaving the page raises the browser's "Leave site?" prompt. Don't force it.
- The text box is a different editor from the article body (class `ql-editor`, label "Text editor for creating
  content"). Cmd+V does nothing in it. Typing works: click the placeholder text, type each paragraph, and press
  Return twice between paragraphs. Read it back with `innerText` (2026-10-13).
- The card under the text shows the cover image, or the article's first image when there is no cover.
- After Publish the tab moves to `https://www.linkedin.com/pulse/<slug>/?published=t` and shows "Congrats on
  publishing your latest article, Adam!". The published address is that one without `?published=t` (2026-10-13).

## Not yet proven

Try these on the first run that needs them, then move the result into the sections above with a date.

- **Screenshots:** capturing one diagram or table from the live page as an image file. First attempt: open the
  post, scroll the element into view, take a zoomed capture of its bounding box saved to disk, and move the file to
  the path in `images.tsv`. Check the file by opening it before using it.

## Gotchas

- A file dialog can't be operated: never click a button that opens one.
- LinkedIn adds an empty paragraph after each pasted image. Leave it; it doesn't show as a gap worth fixing.
- The run owns the clipboard. Anything Adam copies mid-run would be pasted into the article.
- The test draft "TRIAL DRAFT - do not publish" from 2026-10-13 may still be in Adam's drafts. Never open,
  publish or delete it.
