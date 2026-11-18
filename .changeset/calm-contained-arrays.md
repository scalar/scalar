---
'@scalar/workspace-store': patch
'@scalar/mock-server': patch
'@scalar/blocks': patch
'@scalar/api-reference': patch
'@scalar/api-client': patch
---

fix: respect contains match counts in simple array examples

Generate matching and nonmatching primitive items for direct contains constraints, counting tuple prefixes and respecting item schemas, length bounds, uniqueness, and the declared dialect. Authored examples remain authoritative. Candidate generation is bounded and may return a partial example for contradictory constraints.

Complex references and compositions, nested object or array candidate synthesis, and XML branch reconstruction retain existing best-effort behavior and are deferred to a follow-up.
