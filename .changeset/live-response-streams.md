---
'@scalar/api-client': minor
'@scalar/helpers': patch
---

Display JSON Lines, JSON Sequences, and multipart response parts as they arrive instead of waiting for the complete response. Preserve cancellation and show malformed records, incomplete multipart responses, and bounded display limits.

JSON Lines responses (including `application/jsonl`) and `multipart/mixed` or `multipart/x-mixed-replace` responses now use the streaming text viewer, including finite responses. Other multipart subtypes, such as `multipart/form-data`, retain the buffered viewer. Nested parts use hierarchical labels, such as Part 1.1.
