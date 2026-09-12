---
'@scalar/workspace-store': patch
---

Truncate deeply nested examples with an empty value of the declared type — `{}`, `[]`, or a placeholder of the declared primitive — instead of the `[Max Depth Exceeded]` string, so a truncated example no longer contradicts the type its schema declares. A value the schema states outright through `example`, `examples`, `default`, `const` or `enum` wins at that depth, including through a composition wrapper; a property excluded by `mode` is omitted there rather than replaced by a placeholder; and a composition nothing can describe, or a negative constraint, answers with `null`. Only schemas that describe no shape at all keep the sentinel. A schema shared between a deep chain and a shallower position is also no longer served the truncated example.
