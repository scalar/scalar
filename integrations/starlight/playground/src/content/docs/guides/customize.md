---
title: Customize
description: Change where the API reference lives and what it is called.
---

The plugin takes a few options. For example, serve the reference from a
different path and rename the sidebar entry:

```js
// astro.config.mjs
scalarStarlight({
  configuration: { url: '/openapi.json' },
  pathname: '/reference',
  label: 'API',
})
```

See the [package README](https://github.com/scalar/scalar/tree/main/integrations/starlight)
for the full list of options.
