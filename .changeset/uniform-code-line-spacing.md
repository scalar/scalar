---
'@scalar/code-highlight': patch
'@scalar/components': patch
---

Make code block containers own line spacing so highlighted text, plain text, blank lines, and line numbers use the same height. ScalarCodeBlock defaults to 1.4 and Markdown fenced code defaults to 1.5; override either with --scalar-code-line-height on the component or an ancestor. The shared highlighting stylesheet preserves the 1.4 default for direct consumers with a zero-specificity container rule, so existing container overrides still take precedence.
