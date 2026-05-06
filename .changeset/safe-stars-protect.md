---
'@scalar/client-side-rendering': patch
'@scalar/astro': patch
---

fix(client-side-rendering): escape `</script>` and `<!--` in inline-script config

User-controlled values in the configuration (a `content` string, a custom callback's source, the CDN URL, etc.) used to be embedded into the inline `<script>` tag verbatim. A value containing `</script>` would terminate the surrounding script element early, breaking the API reference mount and letting any trailing characters be parsed as HTML. Both the static-mode `getScriptTags` (used by `renderApiReference`) and the Astro `renderMode="client"` script were affected.

The serialization now lives in a single `serializeConfigToScript` helper in `@scalar/client-side-rendering` and applies HTML-safe escaping (`</script` → `<\/script`, `<!--` → `<\!--`). The escape preserves the JavaScript string value while preventing the HTML parser from matching the dangerous sequence. The Astro integration was updated to reuse this helper instead of its own copy of the function-preserving serialization.
