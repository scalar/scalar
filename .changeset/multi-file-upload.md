---
'@scalar/api-client': minor
---

feat(api-client): select multiple files at once for array-typed form fields

When a `multipart/form-data` field is declared as an array (e.g. `files: string[]`), the upload button now opens a multi-select picker. Each selected file becomes its own row reusing the field name, so the request sends one part per file (`files=@a`, `files=@b`) just like Postman.
