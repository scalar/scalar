---
'@scalar/workspace-store': patch
'@scalar/mock-server': patch
---

Serve deprecated response schemas from the mock instead of answering a declared JSON response with an empty body, and generate a deprecated AsyncAPI message payload instead of sending `null`. `getExampleFromSchema` takes a new `includeDeprecated` option for callers that must produce a value satisfying the schema. A declared response header that generates no value is now skipped rather than clearing a header of the same name the mock already set, such as the CORS headers.
