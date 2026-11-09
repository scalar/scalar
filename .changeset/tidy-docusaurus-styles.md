---
'@scalar/docusaurus': patch
---

Load Scalar only on API reference routes and destroy its instances when leaving, preventing standalone styles from affecting other Docusaurus pages.

The CDN bundle is no longer injected on every page. Sites using `window.Scalar.createApiReference` outside an API reference route must load the bundle explicitly. Upgrade pinned CDN bundles to a release with `Scalar.releaseUnusedStyles` for cleanup when navigation interrupts loading.
