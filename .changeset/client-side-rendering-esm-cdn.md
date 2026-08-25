---
'@scalar/client-side-rendering': minor
'@scalar/schemas': minor
'@scalar/types': minor
---

Load the modern ESM build of the API Reference by default

The generated HTML now loads the code-split ESM build (`.../@scalar/api-reference/esm.js`, added in #9871) as a `<script type="module">` by default, instead of the monolithic UMD bundle. Because it is code-split, less JavaScript blocks the first render.

To keep the classic UMD bundle (loaded via `<script src>` and the `window.Scalar` global), set `cdn` to a UMD URL — for example to pin a version — or pass `bundle: false`. You can also pass `bundle: 'https://.../esm.js'` to load a specific ESM build.

Under a strict `script-src` Content Security Policy the ESM build loads its chunks through the module loader, so add `'strict-dynamic'` (or allow-list the CDN host).
