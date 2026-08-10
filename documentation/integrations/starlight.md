# API Reference for Astro Starlight

This is a [Starlight](https://starlight.astro.build) plugin that renders a beautiful API reference based on an OpenAPI/Swagger document, right inside your Starlight docs.

Unlike embedding the [`@scalar/astro` component](./astro.md) on a page yourself, the plugin injects the route and adds the sidebar entry for you.

## Installation

```bash
npm install @scalar/starlight
```

## Usage

Add the plugin to your Starlight configuration and point it at an OpenAPI document:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import { scalarStarlight } from '@scalar/starlight'

export default defineConfig({
  integrations: [
    starlight({
      title: 'My Docs',
      plugins: [
        scalarStarlight({
          // How to configure Scalar:
          // https://scalar.com/products/api-references/configuration
          configuration: {
            url: '/openapi.json',
          },
        }),
      ],
    }),
  ],
})
```

By default the API reference is served from `/api-reference` and shows up as an **API Reference** entry in the Starlight sidebar.

> [!NOTE]
> The sidebar entry is only added when you define a `sidebar` in your Starlight config. If you leave `sidebar` unset, Starlight auto-generates it from your docs — the plugin then does not add the entry (that would replace the auto-generated sidebar and hide your other pages) and logs a note instead. Add the link yourself, e.g. `sidebar: [{ label: 'API Reference', link: '/api-reference' }]`.

The plugin takes our universal configuration object, [read more about configuration](../configuration.md).

## Options

| Option          | Default            | Description                                                                                            |
| --------------- | ------------------ | ----------------------------------------------------------------------------------------------------- |
| `configuration` | —                  | Scalar's universal [configuration object](../configuration.md).                                       |
| `pathname`      | `'/api-reference'` | The path the API reference is served from.                                                            |
| `label`         | `'API Reference'`  | The label of the sidebar entry.                                                                        |
| `title`         | the `label`        | The title of the API reference page.                                                                  |

### Custom path and label

```js
scalarStarlight({
  configuration: { url: '/openapi.json' },
  pathname: '/reference',
  label: 'API',
})
```

> [!NOTE]
> The configuration is serialized into the page as JSON, so function-valued options (a custom `fetch`, `onLoaded`, plugins, …) are not carried over. The plugin builds on [`@scalar/astro`](./astro.md)'s client render mode so the reference keeps working across Starlight's client-side navigation ([view transitions](https://docs.astro.build/en/guides/view-transitions/)).
