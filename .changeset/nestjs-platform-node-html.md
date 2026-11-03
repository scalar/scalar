---
'@scalar/nestjs-api-reference': patch
---

Set the `text/html` content type before sending the API reference, so the page renders with `@nestjs/platform-node`, whose `send()` treats strings as plain text.
