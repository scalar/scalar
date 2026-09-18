---
'@scalar/workspace-store': minor
---

Expose each document whole from the server workspace store through `getResolvedDocument`, for rendering on the server from one reference while the browser keeps loading chunks. Resolve relative chunk references from a static workspace against the URL the document was loaded from; they failed before a request was made.
