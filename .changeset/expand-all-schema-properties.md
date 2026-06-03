---
'@scalar/api-reference': minor
'@scalar/schemas': minor
'@scalar/types': minor
---

feat(api-reference): add `expandAllSchemaProperties` config option.

When enabled, this removes the "Show/Hide Child Attributes" button, making all
nested schema properties visible by default. Expansion is cycle-safe: every
finite branch is expanded fully, and self-referential ($ref or inline) schemas
stop at the point they would otherwise recurse forever.
