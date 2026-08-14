---
'@scalar/json-magic': patch
---

Skip the correct entry when `merge` resolves a delete against a delete. The matching entry was skipped using an index into the first diff list to address the second one, so whenever the two matching deletes sat at different positions in their lists, an unrelated change was silently dropped and the shared delete was duplicated. Merging `[delete x, delete a]` with `[delete a, delete y]` returned `[delete x, delete a, delete a]` instead of `[delete x, delete a, delete y]`.

One case changes for the worse and is pinned by a test: when a delete is subsumed by a delete on the other side that itself ends up in `conflicts`, the subsumed delete is dropped from the result. That gap already existed, but skipping the wrong index used to hide it for some orderings of the second diff list, so it is now consistent rather than order-dependent.
