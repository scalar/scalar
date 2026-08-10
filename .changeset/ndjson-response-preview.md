---
'@scalar/api-client': patch
'@scalar/agent-chat': patch
---

Show NDJSON responses instead of "Binary file". Responses with `application/x-ndjson` or `application/ndjson` are now rendered as text, with each JSON record pretty-printed in the preview.
