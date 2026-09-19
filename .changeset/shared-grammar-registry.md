---
'@scalar/code-highlight': patch
---

Build one lowlight grammar registry per set of languages instead of one per `rehypeHighlight` instantiation. Registering the standard set costs a millisecond or two, which every Markdown render and every code block paid. A caller that passes `aliases` still gets a registry of its own, since registering an alias writes to it.
