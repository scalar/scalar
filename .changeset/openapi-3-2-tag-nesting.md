---
'@scalar/workspace-store': minor
---

feat: support OpenAPI 3.2 nested tags

The navigation tree now nests tags via the OpenAPI 3.2 `tag.parent` field, building an arbitrary-depth hierarchy. A parent tag with no operations of its own is treated as a section; a tag that has both operations and children renders as both. Native `parent` nesting takes precedence over `x-tagGroups`, which stays as the fallback for older documents. The `summary` field is used as the tag title (after `x-displayName`), and the new `parent`, `kind` and `summary` fields are recognized on the Tag Object.
