---
'@scalar/mock-server': patch
---

Keep validating requests when a schema carries `nullable` that Ajv cannot compile.
A nullable `oneOf`, `anyOf` or `allOf` without a `type` now accepts null alongside its branches, and a `nullable` with nothing to widen, or a `nullable: false` beside a type that includes null, is ignored, so the body or parameters of that operation are no longer left unchecked.
