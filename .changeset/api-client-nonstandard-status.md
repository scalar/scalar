---
'@scalar/api-client': patch
---

Show API responses for any HTTP status the server returns, including codes outside 200–599. Stop rebuilding responses with `new Response`, which rejects those statuses and previously caused the request to fail.
