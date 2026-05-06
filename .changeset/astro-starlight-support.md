---
'@scalar/astro': minor
---

feat(astro): improve Starlight support

Adds a `renderMode="client"` mode to `<ScalarComponent />` that mounts Scalar on the client and re-mounts around Astro view-transition events (`astro:before-swap`, `astro:page-load`). This fixes the "content appears only after a refresh" issue on Starlight pages and other Astro sites that use client-side navigation. A new `mountElementId` prop allows overriding the mount container id; if omitted, a unique `scalar-app-<uuid>` is generated per render so multiple components can coexist on one page. Function-valued config props (`content`, `plugins`, `onLoaded`, custom `fetch`, ...) are preserved through the same source-serialization that static mode already uses.
