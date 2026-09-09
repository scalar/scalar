---
'@scalar/workspace-store': patch
'@scalar/api-client': patch
'@scalar/blocks': patch
'@scalar/snippetz': patch
---

Send multipart array properties as separate parts with the same field name, applying encoding to each item. Preserve JSON item content types, uploaded files, and array values after form edits, and generate matching code snippets.

Send JSON form fields without an upload filename and preserve fields and files in request history.

Rename the RestSharp snippet's internal `getMethod` helper so it no longer clashes with the `getMethod` that Nitro bundles into server builds (the new multipart imports shifted chunking and surfaced the collision).
