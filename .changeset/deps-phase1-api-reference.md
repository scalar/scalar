---
'@scalar/api-reference': patch
'@scalar/api-client': patch
---

Bump shared build and runtime dependencies to their latest compatible versions
(fuse.js, vite, vitest, tailwindcss, @vitejs/plugin-vue, @vue/test-utils,
@playwright/test, posthog-js, yaml, and the CSS injection plugin). The fuse.js
7.5.0 upgrade tightened generic inference, so the empty `new Fuse([])` search
instances now pass an explicit `FuseData` type argument.
