---
'@scalar/api-reference': patch
'@scalar/components': patch
---

fix(api-reference): avoid SSR hydration mismatch from the search shortcut and teleport ids

The macOS search shortcut symbol was derived from `navigator` during render, so a Mac client hydrated `⌘` where the server sent `⌃`. The platform is now resolved after mount. Teleport target ids and the search modal ids also switched from `nanoid()` to Vue's SSR-stable `useId()`.
