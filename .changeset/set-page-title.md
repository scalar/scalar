---
'@scalar/api-reference': minor
'@scalar/schemas': patch
'@scalar/types': patch
---

feat(api-reference): add `setPageTitle` to customize the browser tab title

Pass a `setPageTitle` function to control the browser tab title. It is called whenever the section in view changes — on sidebar clicks, on scroll, and when switching documents — and receives the section title and the active OpenAPI document:

```js
setPageTitle: ({ title, document }) => `${document.title} – ${title}`
```
