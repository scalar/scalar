---
'@scalar/code-highlight': patch
---

Set the line-number gutter variables as a single style string instead of an array. `@types/hast` no longer accepts an array for `style`, which broke the declaration build. The serializer had been joining the two declarations with a space, so the rendered `style` attribute is unchanged.
