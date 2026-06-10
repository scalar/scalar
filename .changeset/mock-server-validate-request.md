---
'@scalar/mock-server': minor
---

Validate incoming requests against the matched operation by default. Path/query parameters and the `application/json` request body are checked against their schema, and contract violations return a `422` with an `application/problem+json` body listing every violation. Set `validateRequest: false` to opt out and always return a mock response.
