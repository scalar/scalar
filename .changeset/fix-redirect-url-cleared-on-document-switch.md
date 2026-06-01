---
'@scalar/api-reference': patch
---

fix(api-reference): preserve OAuth redirect URL when switching between OpenAPI documents

Auth changes were being persisted under the wrong document slug and shared a single debounce queue across all documents. When switching documents quickly, the pending save for the first document could be overwritten or dropped by a save for the second document, causing the redirect URL (and other auth secrets) to appear cleared after switching back.

The fix uses `event.documentName` as both the debounce key and the storage key, giving each document its own independent debounce queue.
