---
'@scalar/workspace-store': patch
---

Shorten AsyncAPI navigation id segments: `asyncapi-channel` → `channel`, `asyncapi-message` → `message`, and `asyncapi-operation` → `operation`. This makes the generated navigation ids (and the URLs, anchors, and DOM ids derived from them) shorter and consistent, e.g. `.../channel/planetevents/operation/subscribe/message/planetcreated`.
