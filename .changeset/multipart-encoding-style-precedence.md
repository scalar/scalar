---
'@scalar/api-client': patch
---

fix(api-client): honor `encoding.style` / `explode` / `allowReserved` on multipart parts so an explicit `style: form` opts back into flattened form-style serialization (and ignores `contentType`), per OpenAPI 3.1.1
