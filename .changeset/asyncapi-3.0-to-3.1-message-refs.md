---
'@scalar/asyncapi-upgrader': minor
---

feat: rewrite operation `messages` $refs from `#/components/messages/X` to `#/channels/{id}/messages/X` on 3.0 → 3.1 upgrade (the channel-scoped form 3.1 clarified as required)
