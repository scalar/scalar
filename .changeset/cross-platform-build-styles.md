---
'@scalar/agent-chat': patch
'@scalar/api-client': patch
'@scalar/api-reference': patch
'@scalar/components': patch
'@scalar/sidebar': patch
---

build: use `shx cp` in `build:styles` so the styles directory copy works on Windows, matching the pattern already used in `@scalar/code-highlight` and `@scalar/blocks`.
