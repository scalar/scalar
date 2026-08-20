---
'@scalar/helpers': patch
---

Show a schema type that is referenced more than once in full, instead of rendering `[Circular]` after the first occurrence. Pretty-printing used to collapse every repeated object reference, which also hit two sibling properties pointing at the same `$ref`. Repeated references are now expanded, and only true circular references are collapsed. Very large shared graphs still fall back to collapsing repeated references, so "Show Schema" does not freeze the tab.
