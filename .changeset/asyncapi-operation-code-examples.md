---
'@scalar/snippetz': minor
'@scalar/blocks': minor
'@scalar/api-reference': minor
---

Add operation-level AsyncAPI authored code samples and JavaScript WebSocket generation with message and example selection.

Expose `generateMessageSnippet` and its protocol-specific input type through `@scalar/snippetz/messages` for reuse outside AsyncAPI. Initially supports WebSocket with browser JavaScript.

Use selected server query and cookie API keys in generated browser WebSocket examples, with reactive credentials and masked values in the code block.

Display one selectable message payload panel below each operation code example, with synchronized message pickers and message schemas in the left column.
