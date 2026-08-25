---
'@scalar/client-side-rendering': minor
---

Load the API Reference from the ESM CDN build by default

When no `cdn` is set, the generated HTML now loads `@scalar/api-reference` from the short ESM entry (`/esm.js`, added in #9871) as a `<script type="module">` and calls `createApiReference` directly, instead of the monolithic UMD bundle via the `window.Scalar` global. The bundle is code-split, so the heavy interactive parts load after the page has painted and less JavaScript blocks the first render.

Passing a `cdn` keeps working exactly as before: a UMD or version-pinned URL still loads through `<script src>` and `window.Scalar`. Point `cdn` at an ESM entry (`.../esm.js`, or any `.mjs`/`*.esm.js` URL) to opt into the module build. Under a strict `script-src` Content Security Policy the module build loads its chunks through the module loader, so add `'strict-dynamic'` (or allow-list the CDN host).
