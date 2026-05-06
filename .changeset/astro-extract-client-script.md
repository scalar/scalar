---
'@scalar/astro': patch
---

refactor(astro): extract client mount logic, dedupe in-flight CDN loads, harden against unsafe CDN URLs

The `<ScalarComponent renderMode="client" />` component now keeps a small hoisted script in the template and delegates mounting, unmounting, and CDN/stylesheet loading to a dedicated `client.ts` module. Per-instance configuration flows through a `data-scalar-config` attribute on the container instead of inline `define:vars`. The CDN script and stylesheet loaders now cache their in-flight promise on global state, so multiple `<ScalarComponent />` instances on the same page no longer race to append duplicate `<script>` or `<link>` tags. As defense in depth, CDN URLs with non-`http(s)` schemes (`javascript:`, `data:`, etc.) are now refused with a console error rather than written to `<script src>`, and container ids are run through `CSS.escape` so ids with selector metacharacters do not break `querySelector`. No public API change for consumers.
