# Scalar API Reference for Docusaurus

Docusaurus helps you to ship a beautiful documentation site in no time. For everyone who wants to make their API reference part of a Docusaurus website, we’ve built a Scalar API Reference plugin. Here is how you can integrate it in your project:

## Create a new Docusaurus project (optional)

If you’re starting ~~on a green field~~ fresh, let’s install Docusaurus first:

> Note: It seems there are some issues with Docusaurus and npm. We’d recommend to [use pnpm](https://pnpm.io/installation), which is an awesome alternative to npm.

```bash
pnpm create create-docusaurus@latest my-awesome-website classic
```

If the installer asks you which language you prefer, pick whatever feels right. If you don’t know what TypeScript is, just use JavaScript. Both options will work great:

```bash
? Which language do you want to use?
❯   JavaScript
    TypeScript
```

You’ve got your project ready. Time to start the development server:

```bash
cd my-awesome-website
pnpm start
```

Boom, that’s it. Open <http://localhost:3000/> to see the Docusaurus example documentation.

## Render your OpenAPI reference with Scalar

Okay, you’re ready to render your API reference with Docusaurus? Install our plugin:

> Note: It seems there are some issues with Docusaurus and npm. We’d recommend to [use pnpm](https://pnpm.io/installation), which is an awesome alternative to npm.
>
> Otherwise you’ll probably receive something like:
>
> npm ERR! Cannot read properties of null (reading 'matches')

```bash
pnpm add @scalar/docusaurus
```

Done! There’s just one more step required: Adding the plugin to your Docusaurus configuration.

```ts
// docusaurus.config.js

// …

const config = {
  // …
  plugins: [
    [
      '@scalar/docusaurus',
      {
        label: 'Scalar',
        route: '/scalar',
        configuration: {
          // Put the URL to your OpenAPI document here:
          url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
        },
      },
    ],
  ],
}
```

That’s it, you made it! This should render our Scalar Galaxy example on <http://localhost:3000/scalar>.

## Alternative: Docusaurus Configuration in TypeScript

Hey, big TypeScript fans here. If you’re one, too, here’s the Docusaurus configuration in TypeScript:

```ts
// docusaurus.config.ts
import type { Config } from '@docusaurus/types'
import type { ScalarOptions } from '@scalar/docusaurus'

// …

const config: Config = {
  // …
  plugins: [
    [
      '@scalar/docusaurus',
      {
        label: 'Scalar',
        route: '/scalar',
        configuration: {
          // Put the URL to your OpenAPI document here:
          url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
        },
      } as ScalarOptions,
    ],
  ],
}
```
