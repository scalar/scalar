---
'@scalar/client-side-rendering': minor
---

Load the API Reference from the ESM CDN build by default

The generated HTML now loads `@scalar/api-reference` from the short ESM entry (`/esm.js`, added in #9871) as a `<script type="module">` and calls `createApiReference` directly, instead of the monolithic UMD bundle via the `window.Scalar` global. The browser only downloads the lazy chunks the page actually needs, so the initial JavaScript drops from about 1.04 MB to about 665 KB gzip.

If you pass a custom `cdn`, point it at an ESM build (for example `.../@scalar/api-reference/esm.js`). Under a strict `script-src` Content Security Policy the bundle now loads its chunks through the module loader, so add `'strict-dynamic'` (or allow-list the CDN host).
