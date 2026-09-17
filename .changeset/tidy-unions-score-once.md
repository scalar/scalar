---
'@scalar/validation': patch
---

Memoize union scores during coercion to prevent exponential rescoring of nested recursive unions and cyclic rings.

Reuse cycle-dependent scores only when their active and inactive ancestor checks still match, preserving existing branch selection and circular output references. Keep one contextual result per object/schema pair and use compact dependency masks for larger rings. Evaluate callbacks must return stable results without mutating inputs while scoring.
