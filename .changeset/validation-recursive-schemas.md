---
'@scalar/validation': minor
---

Add recursive schema support for `validate` and `coerce`: both functions now track visited object–schema pairs so cyclic values (self-referential nodes, mutual `lazy` graphs, cyclic records) terminate instead of overflowing the stack. Nested `intersection` members are validated and coerced recursively, and union branch scoring prefers property-less object schemas over primitives for empty objects.

Improve `Static` inference for circular schemas via `LazyStatic` and tuple-folding union statics; `union` and `intersection` use lightweight `UnionMember` / `IntersectionMember` constraints so `lazy(() => self)` call sites type-check without hitting depth limits. `coerce` returns `SafeStatic<S>` (precise `Static<S>` for concrete schemas, `any` when `S` is the full `Schema` union). Export `UnionMember` and `IntersectionMember` from the package entry point.
