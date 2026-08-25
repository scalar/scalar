---
'@scalar/workspace-store': major
---

Validate and coerce OpenAPI documents against the v3.2 schemas so OpenAPI 3.2 fields are preserved in the store instead of being stripped, and type the store (workspace, documents, and navigation) against the v3.2 document. The internal upgrade target stays 3.1, but the public document type now widens to the 3.2 superset (for example `parameter.in` gains `"querystring"`, tags gain `parent`/`kind`/`summary`).
