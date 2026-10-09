---
'@scalar/components': minor
---

Switch `ScalarCodeBlock` from `@scalar/code-highlight` to `@scalar/highlight/compat`. The markup keeps the same `<pre><code class="hljs language-x">` envelope and the same `hljs-*` token classes, so `code.css` and every consumer of the rendered string are unchanged, but the highlighter underneath is now a state machine rather than a lowlight instance built per call — around 47 KB gzipped for all forty grammars against 127 KB before.

Two token colors move, both because the finer scope vocabulary now reaches `code.css` rules that lowlight's output never hit. JSON `true`, `false` and `null` render green rather than purple: highlight.js nested a `hljs-keyword` inside `hljs-literal`, so the keyword color won, and a single `hljs-literal` span now picks up the green that stylesheet already defines for literals. HTTP header values, previously left unstyled, are colored as well. Python docstrings are scoped as comments instead of strings.

`ScalarMarkdown` still uses `@scalar/code-highlight` for its remark/rehype pipeline, which the compat layer deliberately does not cover.
