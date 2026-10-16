---
name: linkedin-article
description: Builds a private LinkedIn draft article in Chrome from a blog post in _src/posts, word for word, with images uploaded from _src/assets and an "Originally published at data-integration.dev" line on top; records the draft in the post's front matter and stops for approval. Use when the user asks to put the latest post on LinkedIn, make a LinkedIn article of a post, cross-post to LinkedIn, or continue a LinkedIn draft.
---

# LinkedIn article

One run turns one live blog post into a finished, unpublished LinkedIn draft and a report for Adam to approve.
**Draft only:** never press Next or Publish, never delete or discard a draft, never change a word of the post.
The only repo changes are `linkedin_draft:` in the post's front matter and files under `.linkedin/`. No commits.
Sign-in is the user's job: never type credentials. macOS only; the run takes over the clipboard, so say so at the start.

Read files only when the step needs them.

| When | Read |
|---|---|
| Always, after the checks below pass | [workflow.md](workflow.md) |
| A placeholder kind, a format difference, or an element the script doesn't know | [convert.md](convert.md) |
| Before the first browser action | [linkedin.md](linkedin.md) |
| Writing the report at the end | [report.md](report.md) |
| The attribution line or the AI sentence is in question | [wording.md](wording.md) |

## Inputs

- **Post:** `_src/posts/<post-name>.md`. With none named, the newest by front matter `date` that has no `linkedin:`
  field. A named post wins. If it already has `linkedin:`, refuse unless the user explicitly asks to republish.
- **Text:** the rendered post at `https://data-integration.dev/posts/<post-name>/`. It is the only source of the
  article text. Not live, or the live title differs from the front matter: stop and say the post must be deployed.
- **Images:** the original files under `_src/assets`, matched to the live page's images in order by the script.
- **Wording:** [wording.md](wording.md). It is the only place the attribution line and the AI sentence are defined.
- **Draft in progress:** `linkedin_draft:` in the front matter. If present, resume that draft; don't start a new one.

## Checks before anything is built

Run from the repo root:

```
NODE_USE_ENV_PROXY=1 node .claude/skills/linkedin-article/scripts/extract.mjs <post-name>
```

In Claude Code's sandbox, Node's `fetch` ignores the proxy and fails with `ENOTFOUND data-integration.dev` without
`NODE_USE_ENV_PROXY=1`. In auto mode, also list `data-integration.dev` as an allowed domain for the command.

## Clipboard scripts and the sandbox

The sandbox blocks `osascript` and `mktemp`, so `scripts/clip-html.sh` and `scripts/clip-image.sh` run outside it
through the exclusion `.claude/skills/linkedin-article/scripts/clip-*` in `.claude/settings.local.json`. If it's
missing, ask Adam to run `/sandbox exclude ".claude/skills/linkedin-article/scripts/clip-*"`. The exclusion only
matches when the command starts with that path, so run each script as its own command from the repo root, spelled
out: no `cd … &&` before it, no `$S` variable, nothing chained after it.

Stop and report when the output says:

- `ok: false`: the message says why (no such post, not live, edit not deployed).
- `ai_disclosure_found: false`: tell Adam the sentence from wording.md is missing from the live page, and check
  whether the local markdown has it (then it only needs deploying). Continue only if he adds it and redeploys, or
  answers that this post had no AI assistance. That answer covers this run only.
- `mapping_ok: false` or `missing_files` not empty: the images can't be matched to files. Show `mapping_note` and
  ask; don't guess which file belongs where.

## Rules

- **The text is Adam's, word for word.** Text reaches LinkedIn only through `scripts/extract.mjs` and the clipboard,
  never retyped or paraphrased, so nothing can be reworded on the way. A typo you notice is reported, not fixed:
  the fix belongs in the markdown.
- **Nothing is added except the attribution line** from wording.md. No call to action, no hashtags, no captions.
- **No script changes LinkedIn's page.** Content goes in by real paste (Cmd+V). Script in the page is for reading
  only (counting blocks and placeholders), because Adam ruled out injecting HTML.
- **Every difference is reported.** What LinkedIn can't show (convert.md) goes in the report, never silently.

## Handoff

When Adam approves the draft, offer `linkedin-teaser`: it writes the teaser and publishes. Pass it the post name.
