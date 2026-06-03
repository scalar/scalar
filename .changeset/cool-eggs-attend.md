---
'@scalar/workspace-store': patch
'@scalar/api-client': patch
---

Send `multipart/form-data` and `application/x-www-form-urlencoded` object properties using their OpenAPI encoding `style`/`explode` (for example `style: deepObject` produces `address[city]=...` bracket notation) instead of always JSON-stringifying them. The request sent over the wire now matches the generated code snippet.
