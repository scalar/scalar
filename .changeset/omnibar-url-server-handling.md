---
'@scalar/api-client': minor
---

Improve omnibar URL pasting and server handling

- Parse full URLs pasted into omnibar, automatically extract server origin and path
- Match pasted URL against existing collection/operation servers
- Add new operation-level server if no match found
- Support ctrl+a+delete to unset the server
- Support backspace at position 0 to unset the server
- Drafts have no collection level servers by default
