# Scalar API Reference for Nuxt

This plugin provides an easy way to render a beautiful API reference based on a OpenAPI/Swagger file with Nuxt.

[![Screenshot of an API Reference](https://github.com/scalar/scalar/assets/6176314/178f4e4c-afdf-4c6a-bc72-128ea1786350)](https://docs.scalar.com/swagger-editor)

## Quick Setup

Install the module to your Nuxt application with one command:

```bash
npx nuxi module add @scalar/nuxt
```

That's it! You can now use @scalar/nuxt in your Nuxt app ✨

## Configuration

If you are using nuxt server routes you can enable scalar simply by enabling openAPI in the nitro
config in your nuxt.config.ts

```ts
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

```ts
export default defineNuxtConfig({
  modules: ['@scalar/nuxt'],
  scalar: {
    url: 'https://registry.scalar.com/@scalar/apis/galaxy/latest?format=yaml',
  },
})
```

By default the docs will be hosted at `/docs` but you can easily customize that, here's a more in
depth config example.

```ts
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
    url: 'https://registry.scalar.com/@scalar/apis/galaxy/latest?format=yaml',
  },
})
```

For multiple references, pass in an array of configuration objects which extend on top of the base
config.

```ts
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
        url: 'https://registry.scalar.com/@scalar/apis/galaxy/latest?format=yaml',
        pathRouting: {
          basePath: '/yaml',
        },
      },
      {
        url: 'https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json',
        pathRouting: {
          basePath: '/json',
        },
      },
    ],
  },
})
```

For theme configuration, you can pass a `theme` property to the configuration object. The default theme is `nuxt`, but you can also pass `default` to use the default theme.

```ts
export default defineNuxtConfig({
  modules: ['@scalar/nuxt'],
  scalar: {
    theme: 'nuxt',
  },
})
```

## Troubleshooting

If you come across any `**** not default export` errors, it's likely you are using `pnpm`.
A temporary fix for this would be to enable [shamefully-hoist](https://pnpm.io/npmrc#shamefully-hoist) until
we sort out what is causing the package issues.

To do this, just create a `.npmrc` file in your project root and fill it with:

```bash
shamefully-hoist=true
```
