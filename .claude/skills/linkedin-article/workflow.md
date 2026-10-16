# Workflow

The checks in SKILL.md have passed and `extract.mjs` has written `.linkedin/<post-name>/article.html` and
`images.tsv` (columns: `n`, `kind`, `alt`, `file`). Commands run from the repo root, with the script paths spelled
out (see "Clipboard scripts and the sandbox" in SKILL.md).

## 1. Prepare

1. Tell Adam the run uses the clipboard until it reports back, and that he shouldn't copy anything meanwhile.
2. If `.linkedin/` is not in `.gitignore`, add it.
3. **Screenshots first.** For every `mermaid` and `table` row in `images.tsv` whose `file` doesn't exist yet,
   capture it from the live page and save it at that path (method in linkedin.md, "Screenshots"). If one can't be
   captured after two tries, note it for the report and carry on: its placeholder stays in the draft (convert.md).

## 2. Wave 1: text and placeholders

Skip this wave when the front matter has `linkedin_draft:`; open that address instead and go to wave 2.

1. Open `https://www.linkedin.com/article/new/` in a new tab. A login page: stop and ask Adam to sign in.
2. Click the title field and type the front matter `title` exactly.
3. Click the empty body, run `.claude/skills/linkedin-article/scripts/clip-html.sh .linkedin/<post-name>/article.html`, press Cmd+V.
4. Wait for "Draft - saved". The address is now `https://www.linkedin.com/article/edit/<id>/`.
5. Add `linkedin_draft: <that address>` to the post's front matter, below `date:`. Change nothing else in the file.
6. **Verify the text.** Read the editor (read-only script, see linkedin.md) and compare with the script's summary:
   the number of `[[IMAGE n` placeholders equals `images.total`, and the editor's text with all whitespace removed
   has `fingerprint_chars` characters. A different count: find the first paragraph that differs and stop with it in
   the report. Don't repair text by typing.

## 3. Wave 2: images

Loop over the placeholders still in the draft, lowest number first. For each:

1. Look up row `n` in `images.tsv`.
2. Find the placeholder's text in the editor and triple-click it so the whole line is selected.
3. Run `.claude/skills/linkedin-article/scripts/clip-image.sh <file>`, press Cmd+V, wait until the image shows and the draft says "Draft - saved".
4. Read the editor: placeholder `n` is gone and there is one more image than before. If not, try once more;
   after the second failure leave the placeholder, note it, and go on to the next.

The loop ends when no `[[IMAGE` text is left, or every remaining one has failed twice or has no file. Because the
draft and the front matter record the state, a run that breaks off is continued by starting the skill again.

## 4. Cover

The cover is the file in the summary's `cover` field (the post's first image); none means no cover. Method in
linkedin.md, "Cover". While that section says there is no working method, don't try: leave the cover empty and
name the file in the report so Adam can set it himself.

## 5. Check and report

1. Reload the draft and read it once more: no placeholders, image count equals `images.total`, every image is
   served from `media.licdn.com` (that means LinkedIn stored it), and the text still matches (linkedin.md,
   "Reading the page").
2. Write the report from [report.md](report.md) and stop. Don't open the publish box.
3. Leave the draft tab open for Adam and close any other tab the run opened.

## 6. Afterwards

- If a run proved that LinkedIn behaves differently from linkedin.md, update that file (dated) and mention it in
  the report. Changes to wording.md, convert.md or the rules in SKILL.md are proposed, not made.
- An element the script didn't handle: stop, show it, and propose the change to `extract.mjs` and convert.md.
