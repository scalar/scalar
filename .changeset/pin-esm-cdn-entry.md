---
'@scalar/api-reference': patch
---

Fix lazily loaded features such as "Copy as Markdown" failing with a 404 after a release when the ESM build is loaded from the unversioned jsDelivr URL (`https://cdn.jsdelivr.net/npm/@scalar/api-reference/esm.js`).

jsDelivr caches that URL for days, but the bundle behind it imports content-hashed chunks whose names change with every release, so a cached entry point requested chunk names that no longer existed. The `esm.js` entry point is now generated with the package version and loads the bundle pinned to that version, so every chunk comes from the same release. Pinned CDN URLs and self-hosted copies keep loading the bundle next to the entry point.
