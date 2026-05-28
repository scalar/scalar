---
'@scalar/astro': patch
---

Bring `renderMode="client"` to parity with `renderMode="static"`:

- Normalize the configuration through `getConfiguration` so `url` takes precedence over `content` (and `content` functions are executed) before serialization, matching the static mode.
- Load each `data-cdn` URL even when `window.Scalar` is already defined, so references with different CDN URLs no longer silently share the first-loaded bundle.
