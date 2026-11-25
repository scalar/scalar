---
"@scalar/mock-server": patch
"@scalar/helpers": patch
"@scalar/workspace-store": patch
---

Send authored response header examples (`example`, `examples`, or a `content` media type) instead of values generated from the header schema.

Emit each cookie in its own field and escape Unicode in JSON and XML header examples. Use the referenced schema’s component name as the default XML root element.

Share HTTP quoted-string escaping and support character references for line breaks and Unicode in XML header data.
