---
'@scalar/components': minor
'@scalar/markdown': minor
---

Load syntax highlighting grammars on demand

`ScalarCodeBlock` and `ScalarMarkdown` no longer register every `@scalar/highlight` grammar up front. A code block whose grammar is missing renders as plain text, downloads that one grammar, and highlights once it arrives, so a page only loads the languages it shows. The markup is the same as before once the grammar has loaded, and blocks that are already highlighted do not re-render when another grammar arrives.

Server rendering waits for the grammars a component needs, so server-rendered markup is highlighted exactly as before. To hydrate that markup without a mismatch, await `preloadGrammars(languages)` (exported from `@scalar/components/code-block` and `@scalar/components`) on the client before mounting.

`@scalar/markdown` no longer registers any grammar itself. `rehypeHighlight` lists the languages it could not highlight in `file.data.missingLanguages`, and `htmlFromMarkdown` takes an `onMissingLanguage` callback, so a caller can load those grammars (for example with `loadLanguage` from `@scalar/highlight/lazy`) and render again. To keep highlighting everything synchronously, register the grammars yourself with `registerLanguage(...languages)` from `@scalar/highlight/all`.
