---
'@scalar/client-side-rendering': patch
---

fix(client-side-rendering): escape `</script>` and `<!--` in inline-script config

User-controlled values in the configuration (a `content` string, a custom callback's source, the CDN URL, etc.) used to be embedded into the inline `<script>` tag verbatim. A value containing `</script>` would terminate the surrounding script element early, breaking the API reference mount and letting any trailing characters be parsed as HTML.

The serialization now goes through [`serialize-javascript`](https://github.com/yahoo/serialize-javascript), which preserves function-valued config props (instead of `JSON.stringify` silently dropping them) and applies HTML-safe escaping for `</script`, `<!--`, `<![CDATA[`, and the U+2028 / U+2029 line separators. The escape preserves the JavaScript string value while preventing the HTML parser from matching the dangerous sequence.
