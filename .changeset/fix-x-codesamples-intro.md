---
"@scalar/api-reference": patch
"@scalar/api-client": patch
"@scalar/schemas": patch
"@scalar/workspace-store": patch
---

Add support for x-codeSamples in the introduction section

The `x-codeSamples` extension (and its aliases `x-code-samples` and `x-custom-examples`) now works in the introduction section of the API reference. Previously, custom code samples defined at the `info` level were not displayed in the Client Libraries section.

This fix:
- Adds `x-codeSamples` support to the info object schema in both `@scalar/workspace-store` and `@scalar/schemas`
- Exports `getClients` and `generateCustomId` from `@scalar/api-client` for reuse
- Updates the `ClientSelector` component to merge custom code samples into the dropdown
- Custom samples appear as a "Code Examples" group at the top of the "More" dropdown

When you define code samples in your OpenAPI spec's info section, they will now appear in the Client Libraries dropdown as selectable items, and selecting them will display the custom code content.
