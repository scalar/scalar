---
'@scalar/api-client': patch
---

Show API responses for any HTTP status the server returns, including codes outside 200–599. Preserve network response statuses instead of passing them to the restricted `Response` constructor. Keep streaming completion snapshots bodyless and cloneable so history does not consume or buffer the live stream.
