---
'@scalar/api-reference': minor
'@scalar/schemas': minor
'@scalar/types': minor
---

feat(api-reference): add `expandAllSchemaProperties` config option.

When enabled, nested schema properties are expanded by default while keeping the
"Show/Hide Child Attributes" button available for manual collapsing. Expansion
is cycle-safe: every finite branch is expanded fully, and self-referential
($ref or inline) schemas stop at the point they would otherwise recurse forever.
