---
'@scalar/code-highlight': patch
---

perf(code-highlight): reuse the markdown processor and skip the pipeline for plain paragraphs

`htmlFromMarkdown` rebuilt its twelve-plugin unified chain on every call, and each of those rebuilds ran `createLowlight(standardLanguages)`, re-registering all 57 syntax grammars before rendering. Rendering a single API description paid for a whole highlighter. Profiling an API reference schema put 34-44% of the time in markdown, roughly 70% of it in construction rather than parsing.

Two changes. One lazily created lowlight instance is now shared through `rehypeHighlight`'s `lowlight` option, and the processor is frozen and cached per option set (sorted `removeTags`, sorted `allowTags`, transform type). Calls that pass a `transform` callback still build per call, because the callback receives the AST. Separately, a description that is a single plain line with no markdown, HTML or collapsible whitespace now returns the paragraph the pipeline would have produced, without running it.

Output is unchanged. Every unique description in the Stripe OpenAPI document (5,167 of them), plus targeted probes across seven option sets and 40,000 random strings drawn from an alphabet of the excluded metacharacters, render byte-identically before and after.

Two caches now live for the process lifetime: the grammar registry and the processor map. Both are immutable once built, and the registry is only mutated through an `aliases` option this package never passes.
