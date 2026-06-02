---
'@scalar/api-reference': patch
---

Rewrite legacy `model/<name>` schema bookmarks more reliably. The redirect now works under hash base paths and URL-encoded base paths, and rewrites tagged single-document bookmarks (`#tag/<slug>/model/<name>`) that were previously left unredirected.
