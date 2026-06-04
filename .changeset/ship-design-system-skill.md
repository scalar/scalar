---
"@scalar/themes": minor
---

Ship the Scalar design-system agent skill with the package and add an `install-skill` command.

`@scalar/themes` now bundles the `scalar-design-system` skill (design tokens, theming, and a `@scalar/components` reference, plus a Paper design-tool bridge) under `skills/`. Because agents do not auto-discover skills inside `node_modules`, run `npx @scalar/themes install-skill` to install it into your project's `.claude/skills` (or pass a different directory) so Claude Code and compatible agents can use it.
