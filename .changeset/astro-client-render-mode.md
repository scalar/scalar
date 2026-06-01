---
'@scalar/astro': minor
---

Add a `renderMode="client"` option to `<ScalarComponent />` that mounts Scalar in the browser and re-mounts around Astro view-transition events. This fixes the API reference appearing only after a refresh on Starlight pages and other Astro sites that use client-side navigation.
