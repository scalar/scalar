# API Reference for Nuxt

This plugin provides an easy way to render a beautiful API reference based on a OpenAPI/Swagger file with Nuxt.

[![Screenshot of an API Reference](https://github.com/scalar/scalar/assets/6176314/178f4e4c-afdf-4c6a-bc72-128ea1786350)](https://docs.scalar.com/swagger-editor)

## Quick Setup

Install the module to your Nuxt application with one command:

```bash
npx nuxi module add @scalar/nuxt
```

That's it! You can now use @scalar/nuxt in your Nuxt app ✨

## Configuration

If you are using nuxt server routes you can enable Scalar simply by enabling openAPI in the nitro config in your nuxt.config.ts

```typescript
export default defineNuxtConfig({
  modules: ['@scalar/nuxt'],
  nitro: {
    experimental: {
      openAPI: true,
    },
  },
})
```

If you would like to add your own OpenAPI document you can do so with the following minimal config

```typescript
export default defineNuxtConfig({
  modules: ['@scalar/nuxt'],
  scalar: {
    url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=yaml',
  },
})
```

By default the docs will be hosted at `/docs` but you can easily customize that, here's a more in
depth config example.

```typescript
export default defineNuxtConfig({
  modules: ['@scalar/nuxt'],
  scalar: {
    darkMode: true,
    hideModels: false,
    metaData: {
      title: 'API Documentation by Scalar',
    },
    proxyUrl: 'https://proxy.scalar.com',
    searchHotKey: 'k',
    showSidebar: true,
    pathRouting: {
      basePath: '/scalar',
    },
    url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=yaml',
  },
})
```

For multiple references, pass in an array of configuration objects which extend on top of the base
config.

```typescript
export default defineNuxtConfig({
  modules: ['@scalar/nuxt'],
  scalar: {
    darkMode: true,
    metaData: {
      title: 'API Documentation by Scalar',
    },
    proxyUrl: 'https://proxy.scalar.com',
    configurations: [
      {
        url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=yaml',
        pathRouting: {
          basePath: '/yaml',
        },
      },
      {
        url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
        pathRouting: {
          basePath: '/json',
        },
      },
    ],
  },
})
```

For theme configuration, you can pass a `theme` property to the configuration object. The default theme is `nuxt`, but you can also pass `default` to use the default theme.

```typescript
export default defineNuxtConfig({
  modules: ['@scalar/nuxt'],
  scalar: {
    theme: 'nuxt',
  },
})
```

## Static site generation

You can generate the API reference as static HTML with Nuxt and deploy it without a Node.js server. Keep SSR enabled (the Nuxt default): setting `ssr: false` generates a client-rendered shell instead of the API reference content.

### Configure the reference

Install `@scalar/nuxt` using the [quick setup](#quick-setup) above. Save an OpenAPI document as `openapi.json` in your Nuxt project root. For example:

```json
{
  "openapi": "3.0.3",
  "info": {
    "title": "Static Pets API",
    "version": "1.0.0"
  },
  "servers": [{ "url": "https://api.example.com" }],
  "paths": {
    "/pets": {
      "get": {
        "summary": "List pets",
        "tags": ["Pets"],
        "responses": {
          "200": { "description": "A list of pets" }
        }
      }
    }
  }
}
```

Import it in `nuxt.config.ts` and add the reference's base path to Nitro's prerender routes:

```ts
import document from './openapi.json'

export default defineNuxtConfig({
  modules: ['@scalar/nuxt'],
  scalar: {
    content: document,
    pathRouting: {
      basePath: '/docs',
    },
  },
  nitro: {
    prerender: {
      routes: ['/docs'],
      crawlLinks: true,
    },
  },
})
```

The module registers a catch-all route, so explicitly adding `/docs` gives the prerenderer a starting point even if no other page links to it. With `crawlLinks: true`, Nitro follows links in the rendered reference and generates the linked tag and operation routes too. For the example above, this includes `/docs/tag/pets/GET/pets`.

Your app also needs a home page because `nuxt generate` tries to prerender `/`. If you do not already have one, create `app/pages/index.vue` in Nuxt 4 (`pages/index.vue` in Nuxt 3):

```vue
<template>
  <main>
    <h1>API documentation</h1>
    <NuxtLink to="/docs">Read the API reference</NuxtLink>
  </main>
</template>
```

If your app has a custom `app.vue`, make sure it renders `<NuxtPage />` so the module's routes can render.

### Generate and preview

Run these commands from your Nuxt project:

```bash
npx nuxt generate
npx serve .output/public
```

Open `/docs/` on the preview server. Deploy the contents of `.output/public`, including the `_nuxt` assets and payload files, to your static host. No Nitro server is needed in production. See [Nuxt prerendering](https://nuxt.com/docs/4.x/getting-started/prerendering) for more details.

Before deploying, check that:

- `.output/public/docs/index.html` contains your API title and operation text as HTML, not only inside a script or payload.
- The reference remains readable with JavaScript disabled. Search and request testing need JavaScript.
- An operation URL opens directly and still works after refreshing. For this example, check `/docs/tag/pets/GET/pets/` and its generated `index.html` file.

The static host must serve generated directory indexes. Routes the crawler does not discover need explicit entries in `nitro.prerender.routes`; a client-side fallback alone does not generate their HTML. If you customize slugs or hide navigation links, verify the resulting URLs and output files instead of assuming every route was crawled.

### Documents and multiple references

You can replace `content` with `url` to fetch an API description during generation. The URL must be reachable from the build environment. For a local public file, place it at `public/openapi.json` and use `url: '/openapi.json'`. Regenerate and redeploy when the API description changes: the generated HTML and Nuxt payload contain a snapshot from the build.

For multiple references, add each configured base path to `nitro.prerender.routes`. For the `/yaml` and `/json` configurations shown above, use `routes: ['/yaml', '/json']` and keep `crawlLinks: true`.

Static hosting does not run your Nuxt server routes. If you use Nitro's experimental OpenAPI generation, ensure the API description is available during prerendering and that any API endpoints used by the reference are hosted separately. Use absolute URLs in the OpenAPI `servers` array so “Test Request” calls your deployed API.

Nuxt handles rendering and client hydration itself; you do not need `@scalar/server-side-rendering`. To generate a standalone HTML reference without Nuxt, see [static site generation with the server-side renderer](../server-side-rendering.md#static-site-generation).

## Using with Tailwind CSS

If your Nuxt project uses Tailwind CSS v4, you need to set the CSS layer order so that Tailwind's utility classes take priority over Scalar's styles. Add this to the top of your main CSS file (for example, `assets/css/main.css`):

```css
@layer scalar-base, scalar-theme, scalar-config, theme, base, components, utilities;
@import 'tailwindcss';
```

For full details, see [Embedding with CSS Frameworks](../themes.md#embedding-with-css-frameworks).

## Troubleshooting

If you come across any `**** not default export` errors, it's likely you are using `pnpm`.
A temporary fix for this would be to enable [shamefully-hoist](https://pnpm.io/npmrc#shamefully-hoist) until
we sort out what is causing the package issues.

To do this, just create a `.npmrc` file in your project root and fill it with:

```bash
shamefully-hoist=true
```
