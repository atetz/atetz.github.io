# Draft report

Shown in chat when the draft is ready or the run stopped. Nothing is saved to a file: the state is the draft itself
and `linkedin_draft:` in the front matter. A second run on the same post resumes the draft and reports again.

## Layout

```
**Draft ready for approval: <title>**

Draft: <https://www.linkedin.com/article/edit/<id>/>
Original: <https://data-integration.dev/posts/<post-name>/>

| Check | Result |
|---|---|
| Text | matches the live post (<fingerprint_chars> characters) / differs at "<first words of the paragraph>" |
| Images | <placed> of <total> placed |
| Cover | <file> / none / could not be set |
| AI sentence | found / missing, continued on your word |
| Stored by LinkedIn | all images / <n> not yet |

**Differences from the blog** (format only, your words are unchanged)
- <one line per entry in the summary's `differences`, in plain words>

**Needs your attention**
- <placeholders that failed, screenshots that could not be made, typos noticed, anything unusual>

**Changed in the repo**
- `linkedin_draft:` added to `_src/posts/<post-name>.md` (uncommitted)
- <skill files updated, if any>

Approve the draft and I'll hand over to `linkedin-teaser` for the teaser and publishing.
```

## Rules

- Leave out "Needs your attention" when there is nothing; never pad it.
- A run that stopped early uses the same layout with the title "Draft incomplete" and says which step it stopped
  at and how to continue (usually: run the skill again).
- State what was verified by reading the draft back, and say so when a check couldn't be done.
