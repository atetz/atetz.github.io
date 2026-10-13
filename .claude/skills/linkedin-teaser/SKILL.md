---
name: linkedin-teaser
description: Writes the short LinkedIn post that accompanies a drafted article, in Adam's own teaser style, giving away the conclusion and the numbers; after the text is approved, publishes the article and teaser together in Chrome and records the address in the post's front matter. Use when the user says the LinkedIn draft is approved, asks to write the teaser, or asks to publish the LinkedIn article.
---

# LinkedIn teaser

One run writes the teaser for one drafted article, gets it approved, and publishes article and teaser together.
**Publishes after approval:** press Publish once, and only after Adam approved the draft and the exact teaser text
shown to him. Never comment, never edit the article body, never publish anything else, never discard a draft.
Sign-in is the user's job: never type credentials. No commits.

Read files only when the step needs them.

| When | Read |
|---|---|
| Writing the teaser | [style.md](style.md), then [examples.md](examples.md) |
| Before the first browser action | [../linkedin-article/linkedin.md](../linkedin-article/linkedin.md). It is the only copy of the browser facts |

## Inputs

- **Post:** `_src/posts/<post-name>.md`, passed by `linkedin-article` or named by Adam. With none named, the post
  whose front matter has `linkedin_draft:`. None has it: stop and offer `linkedin-article`. Several: ask which.
- **Draft:** the address in `linkedin_draft:`.
- **Draft approval:** Adam's yes to the draft report. If it wasn't given in this conversation, ask before writing.
- **Facts for the teaser:** the post's markdown. It is the only source of claims and numbers.

## Steps

1. Read the post. Note its conclusion and every number that carries the result (counts, times, costs, percentages).
2. Write the teaser following style.md, in the post's language.
3. Show it in chat as a quoted block, followed by: "Approving this publishes the article and this text to your
   network." Ask for approval or edits.
4. On an edit, apply it and show the full text again. Approval covers only the text last shown.
5. Open the draft. Read it: no `[[IMAGE` placeholder left, title equals the front matter title. Otherwise stop and
   offer `linkedin-article` to finish the draft.
6. Press Next. Click the text box and type the approved teaser, paragraph by paragraph, with Return twice between
   paragraphs. Paste doesn't work in this box (linkedin.md).
7. Read the box back and compare it with the approved text: same characters, one blank line between paragraphs.
   Different: stop without publishing and show the difference.
8. Press Publish. Wait for LinkedIn's confirmation and read the published article's address.
9. In the front matter, replace the `linkedin_draft:` line with `linkedin: <published address>`. Change nothing else.
10. Delete `.linkedin/<post-name>/`. Close the tabs the run opened.
11. Report: the published address, the teaser as published, and that the front matter change is uncommitted.

If the run stops while the publish box is open, leave the tab as it is and tell Adam. Closing the box asks to
discard and leaving the page raises a prompt (see linkedin.md); never choose "Discard".

## Rules

- **Only true claims.** Every statement and number in the teaser comes from the post. A conclusion you can't find
  stated in the post is a question to Adam, not a guess.
- **The teaser is the only text this skill writes.** The article was approved as it is; don't touch it.
- **Style changes are proposed.** If Adam edits a teaser before approving, offer afterwards to record the pattern
  in style.md and add the published teaser to examples.md. Apply only on his yes.
- **Browser facts learned here** (the publish box, the confirmation message, where the address appears) go into
  `../linkedin-article/linkedin.md`, dated, without asking.
