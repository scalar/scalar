---
'@scalar/api-client': patch
---

Fix "Test Request" discarding an edited request body when the operation it opens is already the one shown in the client. Opening the modal on the entry that is already selected does not route anywhere, so the request body kept its edited value while the composition selection was replaced with whatever the reference page had selected. The request body read that as a manual `oneOf`/`anyOf` branch switch and regenerated itself from the schema. The selection is now only applied when the modal actually moves to a different entry.
