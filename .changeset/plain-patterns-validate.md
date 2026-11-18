---
'@scalar/mock-server': patch
---

Keep validating requests when a schema `pattern` is only valid without the unicode flag.
A pattern such as `^\d{5}(\-\d{4})?$` that uses an escape like `\-`, `\_` or `\ ` now compiles as a plain ECMA-262 regular expression, so the body or the parameters of that operation are no longer left unchecked, and a pattern that parses with the unicode flag keeps it.
