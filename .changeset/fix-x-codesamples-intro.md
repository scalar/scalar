---
"@scalar/api-reference": patch
"@scalar/schemas": patch
"@scalar/workspace-store": patch
---

Add support for x-codeSamples in the introduction section

The `x-codeSamples` extension (and its aliases `x-code-samples` and `x-custom-examples`) now works in the introduction section of the API reference. Previously, custom code samples defined at the `info` level were not displayed in the Client Libraries section.

This fix:
- Adds `x-codeSamples` support to the info object schema in both `@scalar/workspace-store` and `@scalar/schemas`
- Updates the `ClientSelector` component to display custom code samples when they match the selected client language
- Passes code samples from the info object to the introduction section

When you define code samples in your OpenAPI spec's info section, they will now be displayed in the Client Libraries section when you select the corresponding language tab.
