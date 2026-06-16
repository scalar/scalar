---
'@scalar/use-hooks': patch
---

Fix an SSR hydration mismatch in the color-mode toggle: the system preference is now resolved after mount so the first client render matches the server.
