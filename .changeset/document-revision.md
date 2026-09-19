---
'@scalar/workspace-store': minor
---

Add `getDocumentRevision(document)`, a counter the store bumps on every write to a document. A consumer caching a derivation of a schema node can validate the entry against it in constant time, instead of walking the subtree to see whether anything moved. It reads the same from any view of the document, including one with the reactive and detect-changes proxies stripped for reads, and returns 0 for a document no store tracks.
