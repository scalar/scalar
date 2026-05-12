---
'@scalar/api-client': patch
---

fix: format raw JSON responses with jsonc-parser

Raw JSON response bodies in the API client are now formatted with `jsonc-parser` instead of `@scalar/helpers` `prettyPrintJson`. The previous path parsed with `JSON.parse` and re-stringified with `JSON.stringify`, which coerces every JSON number to a JavaScript `Number` and loses precision for integers beyond `Number.MAX_SAFE_INTEGER` (a common pain point for 64-bit IDs and other large values). `jsonc-parser` formats the document as text, so numeric literals stay identical to the response on the wire while indentation and line breaks are still normalized. JSON with Comments (JSONC) tokens also remain valid alongside CodeMirror’s JSON mode.