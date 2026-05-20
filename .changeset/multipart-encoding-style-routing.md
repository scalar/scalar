---
'@scalar/api-client': patch
---

fix(api-client): serialize `multipart/form-data` and `application/x-www-form-urlencoded` parts with form / spaceDelimited / pipeDelimited / deepObject styles per RFC6570 when `encoding.style` / `explode` / `allowReserved` is set, matching how query parameters are already serialized. Replaces the dotted-key flattening previously emitted for `style: form, explode: true`.
