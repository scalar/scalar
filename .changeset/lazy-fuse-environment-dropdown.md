---
'@scalar/api-client': patch
---

Load fuse.js for the environment variable dropdown the first time it opens

Until fuse.js arrives, or if it fails to load, the dropdown matches the query as a plain substring, then matches fuzzily as before. The highlighted variable stays highlighted when the matches change under it, so Enter always inserts the variable the highlight shows. Search still imports fuse.js up front, so the API Reference and the API Client bundles do not shrink until search loads it on demand too.
