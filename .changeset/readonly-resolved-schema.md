---
'@scalar/workspace-store': minor
---

Type the result of `resolve.schema` as read-only. A resolved schema is the document's own node or a shallow merge over it, so writing to it writes into the document behind the store's back; every change belongs in a store mutation, and a caller that needs a modified shape copies what it needs first. No in-repo consumer had to change.
