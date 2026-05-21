---
'@scalar/api-client': patch
'@scalar/workspace-store': patch
---

feat(api-client): expand nested object properties of multipart form-data schemas into individual editable rows (e.g. `props.name`, `props.description`); the wire still sends one `application/json` multipart part per top-level object property — both for the initial schema-derived example and for edited form rows
