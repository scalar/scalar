---
'@scalar/json-magic': patch
---

Skip the correct entry when `merge` resolves a delete against a delete. The matching entry was skipped using an index into the first diff list to address the second one, so whenever the two matching deletes sat at different positions in their lists, an unrelated change was silently dropped and the shared delete was duplicated. Merging `[delete x, delete a]` with `[delete a, delete y]` returned `[delete x, delete a, delete a]` instead of `[delete x, delete a, delete y]`.
