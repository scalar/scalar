---
'@scalar/api-client': patch
---

fix(api-client): serialize multipart parts with form / spaceDelimited / pipeDelimited / deepObject styles per RFC6570, matching how query parameters are already serialized. Replaces the dotted-key flattening previously emitted for `style: form, explode: true`.
