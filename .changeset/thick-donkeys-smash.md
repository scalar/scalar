---
'@scalar/code-highlight': patch
---

Stop rebuilding the Markdown pipeline on every render

`htmlFromMarkdown` constructed a fresh `unified` processor on each call, and
`rehypeHighlight` built a new lowlight registry of every standard grammar at
plugin-init — so a full ~55-grammar registry was created for every rendered
description. Processors are now cached by their tag allowlist, one lowlight
instance is shared, and renders without a `transform` are memoized.

Output is unchanged: verified byte-identical across 165 snapshots covering the
option shapes `ScalarMarkdown` passes.
