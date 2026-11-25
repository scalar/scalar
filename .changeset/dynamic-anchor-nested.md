---
'@scalar/blocks': patch
'@scalar/json-magic': minor
'@scalar/workspace-store': minor
---

Resolve JSON Schema 2020-12 `$dynamicRef` in the magic proxy and expose the bound schema through `@scalar/workspace-store/resolve`. Generic and recursive schemas now show their concrete types in rendered properties and JSON/XML request examples, including anchors nested inside a schema resource.

Keep repeated reads stable within each dynamic scope while allowing shared templates to bind independently. Edits through the proxy refresh bindings and resolved references while preserving ordinary proxy identities and unrelated documents’ anchor caches.
