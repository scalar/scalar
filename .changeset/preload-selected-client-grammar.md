---
'@scalar/api-reference': patch
'@scalar/blocks': minor
---

Start loading the grammar of the selected code example client as soon as it is known, from the configuration or the reader's saved choice, so its snippets are usually coloured when they appear. `@scalar/blocks/code-example` exports `getClientLanguage`, which maps a client id to the language its snippet is highlighted as.
