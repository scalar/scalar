---
'@scalar/api-client': minor
---

feat: add CodeInputLite for lightweight variable input

Introduce `CodeInputLite`, a single-line input that renders `{{varname}}` pills and offers environment-variable autocomplete without the CodeMirror dependency. The AddressBar and other simple `CodeInput` call sites (request table rows, data table input, environment variables table) now use `CodeInputLite`, reducing bundle size and runtime overhead for inputs that do not need full editor features.
