---
'@scalar/highlight': patch
---

Highlight a curl request body as JSON, keep curl values intact across `'\''`, and mark a line-ending backslash as punctuation in curl and Bash. Curl flags are now plain text with no class of their own, so `true`, `false` and `null` in a body keep their colour.

Support JSON bodies attached to long options with `=`, including across shell line continuations. Keep bracketed plain text and form fields as strings, and preserve escaped apostrophes in the surrounding JSON key or value scope.

Highlight valid JSON after grouped short options such as `-sd`, keep closed malformed bodies as strings, and leave numeric and dotted options unscoped. Keep grouped switches plain before options that take a value, respect shell argument boundaries around JSON bodies, and mark continuations inside double quotes as punctuation.
