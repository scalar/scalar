---
'@scalar/api-client': patch
'@scalar/api-reference': patch
---

Add a `canDeleteSchemes` prop to the auth selector so the delete (trash) affordance can be hidden. It defaults to `true` (unchanged for the API client, where schemes are editable) and the API reference now passes `false`, since its schemes come from the rendered document and cannot be removed there.
