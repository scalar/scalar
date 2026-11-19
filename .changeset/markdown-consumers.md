---
'@scalar/components': patch
'@scalar/api-reference': patch
'@scalar/openapi-to-markdown': patch
---

Render Markdown through `@scalar/markdown` instead of `@scalar/code-highlight`

None of them pull in lowlight or highlight.js any more: code blocks in descriptions are highlighted by `@scalar/highlight`, the same highlighter `ScalarCodeBlock` uses. A fenced code block without a language is no longer auto-detected and renders as plain text. In `@scalar/openapi-to-markdown` this shows up in descriptions that contain HTML or alerts: an unlabeled fence used to come out labeled with highlight.js's guess (often wrong, such as `properties` for JSON), and now stays unlabeled.
