---
'@scalar/workspace-store': patch
'@scalar/json-magic': patch
'@scalar/object-utils': patch
---

Prevent prototype pollution when merging documents and writing nested values or JSON references, while preserving prototype-named JSON data properties.

Dot-separated mutations now reject new `constructor` and `prototype` keys, as well as `__proto__`, instead of creating these keys through inherited properties.
