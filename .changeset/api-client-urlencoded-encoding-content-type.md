---
'@scalar/api-client': patch
---

fix(api-client): ignore `encoding.contentType` on `application/x-www-form-urlencoded` request bodies

Per OAS 3.1.x Encoding Object, `contentType` SHALL be ignored when the request body media type is not a multipart. After the recent change that lifted the multipart gate on `encoding.style`/`explode`/`allowReserved`, the `encoding` map started being passed for urlencoded bodies too. As a side effect, a urlencoded encoding entry that only set `contentType` would JSON-stringify object values into a single part instead of keeping the spec-default dotted-key flattening. Suppress `contentType` for non-multipart bodies so the flattening branch is restored.
