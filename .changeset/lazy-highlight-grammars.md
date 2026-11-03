---
'@scalar/components': patch
'@scalar/markdown': minor
---

Load syntax highlighting grammars on demand

`ScalarCodeBlock` and `ScalarMarkdown` no longer register every `@scalar/highlight` grammar up front. A code block renders as plain text, downloads the grammar for its language, and highlights once it arrives, so a page only loads the languages it actually shows. The markup is the same as before once the grammar has loaded.

`@scalar/markdown` no longer registers any grammar itself. `rehypeHighlight` lists the languages it could not highlight in `file.data.missingLanguages`, and `htmlFromMarkdown` takes an `onMissingLanguage` callback, so a caller can load those grammars (for example with `loadLanguage` from `@scalar/highlight/lazy`) and render again. To keep highlighting everything synchronously, register the grammars yourself with `registerLanguage(...languages)` from `@scalar/highlight/all`.
