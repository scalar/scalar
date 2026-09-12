---
'@scalar/workspace-store': patch
'@scalar/mock-server': patch
---

Serve deprecated response schemas from the mock instead of answering a declared JSON response with an empty body. `getExampleFromSchema` takes a new `includeDeprecated` option for callers that must produce a value satisfying the schema; a response header whose schema generates nothing is no longer deleted.
