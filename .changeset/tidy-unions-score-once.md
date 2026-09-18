---
'@scalar/validation': patch
---

Memoize union scores during coercion to prevent exponential rescoring of nested recursive unions and cyclic rings.

Reuse cycle-dependent scores only when their active and inactive ancestor checks still match, preserving existing branch selection and circular output references. Keep one contextual result per object/schema pair and use compact dependency masks for larger rings. Evaluate callbacks must return stable results without mutating inputs while scoring.

Document the evaluate callback stability contract and measured resource tradeoffs: memoization can increase peak memory on ordinary documents and increase both time and memory for many independent cycles. This optimization does not impose a resource budget.
