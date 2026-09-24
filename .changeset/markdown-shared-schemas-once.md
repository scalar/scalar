---
'@scalar/openapi-to-markdown': patch
---

Render each shared schema once per page. The first reference to a structured schema expands it and labels it with its name (for example `schema: Account`). Later references print "Schema `Account` is shown above." instead of expanding it again. Model sections for schemas already expanded on the page refer back to them too. True cycles still print `[Circular Reference]`. This keeps Markdown output proportional to the schema graph, rather than to the number of paths through it. Before this change, densely linked descriptions such as Stripe's ran out of memory when rendering a single operation.

A node budget per operation and model section adds a visible `[Schema output truncated]` marker as a last resort. Generated examples that would exceed 10,000 values are omitted with a note. References past the depth limit now point to the model's own section instead of being cut off.
