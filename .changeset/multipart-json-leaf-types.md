---
'@scalar/workspace-store': patch
---

Keep nested JSON multipart field types after editing the request body form. Editing a form row no longer turns a nested object's booleans, numbers, and arrays into strings on the wire.
