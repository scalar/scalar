---
'@scalar/api-client': patch
'@scalar/api-reference': patch
---

Fix the API client modal getting stuck on "Select an operation to view details" for a document's first operation after its active document re-syncs. The reference used to hand the modal a route to a nonexistent path and method during that re-sync; the modal now leaves the current operation in place instead.
