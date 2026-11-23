---
'@scalar/api-reference': minor
'@scalar/components': patch
'@scalar/workspace-store': minor
'@scalar/types': patch
'@scalar/schemas': patch
---

Render reusable AsyncAPI components in their own reference sections. `components.messages` appear under **Messages** with their headers, payload, examples, and applied traits; `components.messageTraits` appear under **Message Traits**; and `components.operationTraits` appear under **Operation Traits** with their description, security, bindings, and external documentation. The sections sit above **Models**, are searchable, skip hidden components, and follow `hideModels`.
