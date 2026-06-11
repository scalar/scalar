---
'@scalar/api-reference': patch
---

Refactor URL redirects into a routing-agnostic, list-driven engine. Redirects now operate on the bare navigation id, so each rule works across hash, hash-base-path, and path routing automatically. Also redirect old `models/<name>` bookmarks to the configured models section slug when the section label is customized (e.g. `schemas/`).
