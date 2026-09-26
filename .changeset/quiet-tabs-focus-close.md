---
'@scalar/api-client': patch
---

fix: resolve accessibility audit findings in the client modal

- Auth fields (Bearer Token, Username, API key and OAuth inputs) now expose their visible label as the accessible name in both the masked and unmasked state
- Request and response filter tabs no longer carry `aria-controls`, so screen readers announce each tab once when arrowing through them
- Opening the modal from a "Test Request" button now moves focus to the close button first
