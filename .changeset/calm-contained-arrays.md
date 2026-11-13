---
'@scalar/workspace-store': patch
'@scalar/mock-server': patch
---

fix: generate array examples with bounded contains match counts

Count tuple prefixes and search for matching and nonmatching items while respecting item schemas, length bounds, and uniqueness. Honor schema dialects and preserve authored examples. Contradictory or unsupported schemas can produce a partial example; generation remains bounded rather than claiming every schema is satisfiable.
