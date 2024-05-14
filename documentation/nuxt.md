# Scalar API Reference for Nuxt

Nuxt can be considered the default full-stack framework for Vue developers. It’s meant to build performant web apps and websites, all in Vue.js and adding a documentation for your API is really straight forward. Ready to try it? Let’s go!

## Create a new Nuxt project (optional)

Sometimes, you just need a fresh start. Here’s [how to set up a new Nuxt project](https://nuxt.com/docs/getting-started/installation):

```bash
npx nuxi@latest init my-awesome-app
```

And now jump into the folder and start the dev server:

```bash
# Change directory
cd my-awesome-app
# Start the development server
npm run dev -- -o
```

The last command is supposed to open a browser window for you. It should show the “Welcome to Nuxt!” page. Can you see it? Wow, you’ve already got your (first?) Nuxt project set up.

## Enable the OpenAPI features

You can enable [the baked-in OpenAPI features](https://nitro.unjs.io/config#openapi) by enabling `openAPI` in your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  nitro: {
    experimental: {
      openAPI: true,
    },
  },
})
```

And that’s it. Open <http://localhost:3000/_nitro/scalar> to see your new API reference. Honestly, isn’t that cool?

## Use the `@scalar/nuxt` module (optional)

We even made [a dedicated Nuxt Module](https://nuxt.com/modules/scalar) for you. You can install it like this:

```bash
npx nuxi module add @scalar/nuxt
```

`app.vue`

```diff
<template>
  <div>
-    <NuxtWelcome />
+    <RouterView />
  </div>
</template>
```

```ts
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@scalar/nuxt'],
  nitro: {
    experimental: {
      openAPI: true,
    },
  },
})
```

http://localhost:3000/docs

If you would like to add your own OpenAPI specification, you can do so with the following minimal configuration:

```ts
export default defineNuxtConfig({
  scalar: {
    spec: {
      url: 'https://cdn.scalar.com/spec/openapi_petstore.json',
    },
  },
})
```

Read more: [@scalar/nuxt](https://github.com/scalar/scalar/tree/main/packages/nuxt)
