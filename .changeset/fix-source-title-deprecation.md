---
'@scalar/types': patch
'@scalar/schemas': patch
---

Stop marking the per-source `title` and `slug` as deprecated. They are the supported way to name a document and its URL when using multiple `sources`, so the deprecation note (and editor strike-through) was misleading.
