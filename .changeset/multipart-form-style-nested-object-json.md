---
'@scalar/api-client': patch
---

fix(api-client): JSON-stringify nested object/array values under `style: form` instead of emitting `[object Object]` in `multipart/form-data` and `application/x-www-form-urlencoded` bodies. RFC 6570 form-style serialization only addresses one level of nesting and OpenAPI 3.1 leaves deeper structures undefined; readable JSON is more useful than `String(value)` garble. The documented escape hatch for cleaner output remains `style: deepObject` with `explode: true`.
