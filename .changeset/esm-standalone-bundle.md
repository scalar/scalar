---
'@scalar/api-reference': patch
---

Add an ESM standalone build (`dist/browser/standalone.esm.js`) alongside the existing UMD bundle. The new bundle works as a side-effect script (registers `window.Scalar.createApiReference` and reads `data-*` configuration) and exports `createApiReference` for direct ESM consumers. It is fully minified through Rolldown's native minifier so the total size is on par with — slightly smaller than — the UMD bundle.
