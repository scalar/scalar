---
'@scalar/api-client': patch
---

Fix server-sent event requests getting stuck in a loading state by returning the stream reader without waiting for the full response body.
