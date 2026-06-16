---
'@scalar/api-reference': patch
---

Fix an SSR hydration mismatch in the injected `<style>` tag: the CSS is now rendered verbatim instead of being HTML-escaped on the server (`"` became `&quot;`), which broke font styles and caused a hydration mismatch.
