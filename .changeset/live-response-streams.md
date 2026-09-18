---
'@scalar/api-client': minor
'@scalar/helpers': patch
---

Display JSON Lines, JSON Sequences, and multipart response parts as they arrive instead of waiting for the complete response. Preserve cancellation and show malformed records, incomplete multipart responses, and bounded display limits.

JSON Lines responses (including `application/jsonl` and `application/x-ndjson`), JSON Sequences (`application/json-seq` and `+json-seq`) and `multipart/mixed` or `multipart/x-mixed-replace` responses now use the streaming text viewer, including finite responses. Other multipart subtypes, such as `multipart/form-data`, retain the buffered viewer. Nested parts use hierarchical labels, such as Part 1.1.

The streaming viewer shows received bytes and offers Copy text and Download text for the displayed transcript, including after completion, cancellation, or a framing error. These exports contain formatted records and multipart labels/base64 rather than the original wire body. Streams retain at most 16 MiB of displayed text and reject records/parts above 8 MiB; preview plugins and virtualized raw-body rendering remain available only in the buffered viewer. HTTP status, headers, and declared Content-Length remain visible.
