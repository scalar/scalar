# @scalar/validation

## 0.6.0

### Minor Changes

- [#9262](https://github.com/scalar/scalar/pull/9262): feat(validation): support recursive schemas in validate and coerce

  Add recursive schema support for `validate` and `coerce`: both functions now track visited object–schema pairs so cyclic values (self-referential nodes, mutual `lazy` graphs, cyclic records) terminate instead of overflowing the stack. Nested `intersection` members are validated and coerced recursively, and union branch scoring prefers property-less object schemas over primitives for empty objects.

  Improve `Static` inference for circular schemas via `LazyStatic` and tuple-folding union statics; `union` and `intersection` use lightweight `UnionMember` / `IntersectionMember` constraints so `lazy(() => self)` call sites type-check without hitting depth limits. `coerce` returns `SafeStatic<S>` (precise `Static<S>` for concrete schemas, `any` when `S` is the full `Schema` union). Export `UnionMember` and `IntersectionMember` from the package entry point.

### Patch Changes

- [#9262](https://github.com/scalar/scalar/pull/9262): fix(validation): detect cycles when scoring union branches

  `scoreUnion` (used by `coerce` to pick the best matching `union` branch) now tracks the `(value, schema)` pairs that are live on its call stack and returns a neutral positive score on re-entry. A recursive lazy schema such as `lazy(() => union([object({ child: optional(lazy(() => T)) }), …]))` evaluated against a self-referential value previously caused `scoreUnion` to recurse through `lazy → union → object → property → lazy → …` indefinitely and overflow the stack, contradicting the rest of the cycle-handling work. The marker is cleared in `finally` so sibling union branches that share a schema reference are scored independently.

- [#9262](https://github.com/scalar/scalar/pull/9262): fix(validation): do not leak cycle-detection cache across union branches

  Scope the in-progress `(value, schema)` cache used by `validate` to the live call stack instead of treating it as run-wide memoization. The marker for each pair is now cleared before the call returns, so a shared schema reference that failed in one `union` branch (for example the common `base` in `union([intersection([base, objA]), intersection([base, objB])])`) is re-validated in the next branch rather than short-circuiting to `true` from a stale entry. Cycle detection on self-referential and mutually recursive lazy graphs is unaffected because the marker is still present during recursive descent into the same value.

## 0.5.0

### Minor Changes

- [#9211](https://github.com/scalar/scalar/pull/9211): feat: support default values for coersion

## 0.4.0

### Minor Changes

- [#8844](https://github.com/scalar/scalar/pull/8844): feat: support default values for coersion

## 0.3.2

### Patch Changes

- [#9045](https://github.com/scalar/scalar/pull/9045): chore(validation): include package publish files

## 0.3.1

### Patch Changes

- [#9017](https://github.com/scalar/scalar/pull/9017): chore(validation): include package publish files

## 0.3.0

### Minor Changes

- [#8633](https://github.com/scalar/scalar/pull/8633): feat: support union of object as direct child of intersection brench

## 0.2.0

### Minor Changes

- [#8600](https://github.com/scalar/scalar/pull/8600): feat: first class support for optional and intersection types

## 0.1.0

### Minor Changes

- [#8567](https://github.com/scalar/scalar/pull/8567): feat: initial commit ✨
