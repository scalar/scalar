---
"@scalar/mock-server": patch
---

Validate JSON and plain-text request parameters declared with `content`. Malformed JSON is rejected, and JSON values keep their original types during validation, so `?filter={"price":"5"}` is rejected when `price` is an integer.
