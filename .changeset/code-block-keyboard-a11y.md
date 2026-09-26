---
'@scalar/components': patch
'@scalar/blocks': patch
'@scalar/api-reference': patch
'@scalar/api-client': patch
'@scalar/types': patch
---

fix: improve keyboard and screen reader access to code blocks and multiselect comboboxes

- The code block scroller is only a keyboard tab stop while its content actually overflows, and it is exposed as a named group ("Code sample: Shell cURL" in the API Reference, localizable via `operation.codeSample`) so screen readers announce it when it receives focus
- The code block copy button now has a stable accessible name ("Copy Shell code") in every state, including while its visible label is hidden
- In multiselect comboboxes such as the auth scheme picker, Space toggles the active option while the search query is empty instead of hiding the whole list
