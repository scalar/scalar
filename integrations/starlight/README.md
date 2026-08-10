# Scalar API Reference for Astro Starlight

[![Version](https://img.shields.io/npm/v/@scalar/starlight)](https://www.npmjs.com/package/@scalar/starlight)
[![Downloads](https://img.shields.io/npm/dm/@scalar/starlight)](https://www.npmjs.com/package/@scalar/starlight)
[![License](https://img.shields.io/npm/l/@scalar/starlight)](https://www.npmjs.com/package/@scalar/starlight)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

A [Starlight](https://starlight.astro.build) plugin that renders a beautiful Scalar API reference from an OpenAPI document, inside your Starlight docs.

## Installation

```bash
npm install @scalar/starlight
```

## Usage

Add the plugin to your Starlight configuration and point it at an OpenAPI document. It injects a route that renders the API reference inside the Starlight layout and adds a sidebar entry that links to it — no need to hand-create a page.

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
          // Scalar's universal configuration object:
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

The reference is served from `/api-reference` by default.

> [!NOTE]
> If you do not define a `sidebar` in your Starlight config, Starlight auto-generates it from your docs. In that case the plugin does not add the entry (doing so would replace the auto-generated sidebar and hide your other pages) and logs a note instead — add the link yourself, e.g. `sidebar: [{ label: 'API Reference', link: '/api-reference' }]`.

## Options

| Option          | Default            | Description                                                                                     |
| --------------- | ------------------ | ----------------------------------------------------------------------------------------------- |
| `configuration` | —                  | Scalar's universal [configuration object](https://scalar.com/products/api-references/configuration). |
| `pathname`      | `'/api-reference'` | The path the API reference is served from.                                                      |
| `label`         | `'API Reference'`  | The label of the sidebar entry.                                                                 |
| `title`         | the `label`        | The title of the API reference page.                                                            |

> [!NOTE]
> The configuration is serialized into the page as JSON, so function-valued options (a custom `fetch`, `onLoaded`, plugins, …) are not carried over. This mirrors the `renderMode="client"` behavior of [`@scalar/astro`](https://www.npmjs.com/package/@scalar/astro), which this plugin builds on so the reference keeps working across Starlight's client-side navigation.

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
