---
'@scalar/validation': patch
---

Memoize cycle-free union scores during coercion to prevent exponential work on nested recursive unions.

Keep cycle-dependent scores uncached while allowing independent acyclic subtrees to reuse completed scores, even after a sibling encounters a cycle. Fully cyclic input graphs can still require exponential scoring; this change does not provide a general resource bound for adversarial cyclic values. Evaluate callbacks must leave inputs unchanged while scoring.
