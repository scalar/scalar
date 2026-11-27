---
'@scalar/blocks': patch
---

Show only a composed schema's own description. When a schema with its own `description` used `allOf` with a member that has a description of its own (for example a referenced base schema), the Models section showed the member's description under the schema's, unlike Swagger UI.
