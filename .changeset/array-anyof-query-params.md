---
'@scalar/workspace-store': patch
---

Fix `anyOf`/`oneOf` array query parameters (e.g. `Optional[List[str]]`) being sent as a single string instead of repeated query parameters
