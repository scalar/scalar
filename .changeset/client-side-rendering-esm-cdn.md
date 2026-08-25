---
'@scalar/client-side-rendering': minor
'@scalar/schemas': minor
'@scalar/types': minor
---

Add a `bundle` option to load the modern ESM build of the API Reference

By default the generated HTML still loads the classic UMD bundle via `<script src>` and `window.Scalar` — unchanged. Set `bundle: true` to load the code-split ESM build (`.../@scalar/api-reference/esm.js`, added in #9871) as a `<script type="module">` instead, so less JavaScript blocks the first render. Pass a URL string to point at a specific ESM build. `bundle` takes precedence over `cdn`, and the existing `cdn` option keeps working exactly as before.

Under a strict `script-src` Content Security Policy the ESM build loads its chunks through the module loader, so add `'strict-dynamic'` (or allow-list the CDN host).
