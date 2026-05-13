---
'@scalar/client-side-rendering': minor
---

fix(client-side-rendering): escape user-controlled values in the rendered HTML

User-controlled values used to be embedded into the rendered page verbatim in two places:

- **Inline `<script>` body** — config props like `content`, a custom callback's source, etc. A value containing `</script>` would terminate the surrounding script element early, breaking the API reference mount and letting any trailing characters be parsed as HTML.
- **`<script src="…">` attribute** — the CDN URL. A value containing `"` would close the attribute and let trailing markup be parsed as HTML.

The config payload now goes through [`serialize-javascript`](https://github.com/yahoo/serialize-javascript), which preserves function-valued props (instead of `JSON.stringify` silently dropping them) and applies HTML-safe escaping for `</script`, `<!--`, `<![CDATA[`, and the U+2028 / U+2029 line separators. The CDN URL is now HTML-attribute-escaped (`&`, `<`, `>`, `"`, `'`) so it cannot break out of the `src` value.
