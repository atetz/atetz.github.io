# Wording

The only place these two sentences are defined. `scripts/extract.mjs` reads them from here by key, so keep each on
one line after its key. Adam edits this file; the skill only proposes changes to it.

## Added above the article

`{url}` becomes a link to the post on data-integration.dev. It is the only text the skill adds to an article.

attribution: Originally published at {url}

## Looked for in the post, never added

The post itself must contain this sentence (capitalisation and the final full stop are ignored). The skill checks
for it and never writes it.

ai_disclosure: This article was written with the assistance of AI.
