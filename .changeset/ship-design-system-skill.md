---
"@scalar/themes": minor
---

Ship the Scalar design-system agent skill with the package.

`@scalar/themes` now bundles the `scalar-design-system` skill (design tokens, theming, a `@scalar/components` reference, and a Paper design-tool bridge) under `skills/`. Agents do not auto-discover skills inside `node_modules`, so link or copy `node_modules/@scalar/themes/skills/scalar-design-system` into your project's `.claude/skills` to use it.
