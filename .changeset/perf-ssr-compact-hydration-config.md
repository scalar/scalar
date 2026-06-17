---
'@scalar/server-side-rendering': patch
---

Serialize the hydration config compactly instead of pretty-printed. This shrinks the inline hydration script in every server-rendered page and speeds up serialization for large configs.
