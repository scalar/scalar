---
'@scalar/api-reference': minor
'@scalar/schemas': minor
'@scalar/types': minor
---

feat(api-reference)!: the tree layout becomes the default schema renderer

`schemaLayout` now defaults to `tree`. The legacy layout — a bordered card per nesting level behind a "Show Child Attributes" pill — stays available with `schemaLayout: 'legacy'`, and its deletion is scheduled: `depth` and the internal `level` prop coexist for exactly one minor, enforced by a tripwire test that fails if the schedule is dropped while the legacy branch still exists. The legacy class names are not part of that deletion — `.schema-card`, `.property`, `.property--level-N` and their family stay on equivalent nodes as aliases, because `customCss` consumers exist and the changeset policy has no major.

Every visual baseline that renders a schema changes with this release and is regenerated per suite.
