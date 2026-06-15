---
'@scalar/workspace-store': patch
'@scalar/api-client': patch
---

Expand array values inside `deepObject` query parameters with the trailing bracket convention (`filter[ids][]=1&filter[ids][]=2`) instead of collapsing them into a single comma-joined value, both in the request and in the parameter table
