---
'@scalar/api-client': patch
---

Fix "Test Request" discarding an edited request body when the operation it opens is already the one on screen. Reopening the entry the modal already shows does not route anywhere, so the request body kept its edited value while the composition selection was replaced with whatever the reference page had selected. The request body read that as a manual `oneOf`/`anyOf` branch switch and regenerated itself from the schema. An open modal now keeps the selection it is already showing, while opening a different entry still re-establishes it.
