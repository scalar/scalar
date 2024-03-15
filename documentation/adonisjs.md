# Scalar API Reference for AdonisJS

AdonisJS is a TypeScript-first web framework for building web apps and API servers. It comes with support for testing, modern tooling, an ecosystem of official packages, and more.

And you know what? There’s also a great [community package to add OpenAPI support](https://github.com/ad-on-is/adonis-autoswagger) and it comes with the Scalar API reference by default.

## Create a new AdonisJS project (optional)

If you’re starting on a green field, you’ll first need to [initialize a new AdonisJS project](https://docs.adonisjs.com/guides/installation):

```bash
npm init adonisjs@latest my-awesome-app
```

You’ll be asked a few questions. Pick whatever feels right to you. If you’re feeling overwhelmed, use the following options for the sake of this guide:

```
Which starter kit would you like to use?
❯ API Starter Kit

Select the authentication guard you want to use …
❯ Access Token

Select the database driver you want to use …
❯ SQLite

Do you want us to install dependencies using "npm"?
❯ Yes
```

Wow, you’re half way there already. Jump into the directory and start the devlopment server:

```bash
cd my-awesome-app
npm run dev
```

Done? Open http://localhost:3333 in your browser.

## Set up Adonis Autoswagger (optional)

Time to set up the community package to add OpenAPI support to your AdonisJS project:

```bash
npm add adonis-autoswagger
```

We’ll also need to add a configuration file:

```
// config/openapi.ts
import path from 'node:path'
import url from 'node:url'

export default {
  path: path.dirname(url.fileURLToPath(import.meta.url)) + '/../',
  title: 'My Awesome App',
  version: '1.0.0',
  snakeCase: true,
  tagIndex: 2,
  ignore: ['/openapi', '/docs'],
  // If PUT/PATCH are provided for the same route, prefer PUT
  preferredPutPatch: 'PUT',
  common: {
    // OpenAPI conform parameters that are commonly used
    parameters: {},
    // OpenAPI conform headers that are commonly used
    headers: {},
  },
}
```

[Head over to the repository](https://github.com/ad-on-is/adonis-autoswagger) to learn more about the configuration file or how to use it with AdonisJS 5.

## Render your OpenAPI reference with Scalar

To actually serve an OpenAPI file and render the reference with Scalar you can extend your routes file:

```
// start/routes.ts
import router from '@adonisjs/core/services/router'
import AutoSwagger from 'adonis-autoswagger'
import openapi from '#config/openapi'

// Just an example route
router.get('/', async () => {
  return {
    hello: 'world',
  }
})

// Returns the OpenAPI file as YAML
router.get('/openapi', async () => {
  return AutoSwagger.default.docs(router.toJSON(), openapi)
})

// Renders the API reference with Scalar
router.get('/docs', async () => {
  return AutoSwagger.default.scalar('/openapi')
})
```

Boom, that’s it. Go to <http://localhost:3333/docs> and see your new OpenAPI-based reference.

You’ll notice there isn’t that much in there. To actually make this useful, you’ll need to work with [Controllers in AdonisJS](https://docs.adonisjs.com/guides/controllers) and [learn about the syntax that Adonis Autoswagger uses](https://github.com/ad-on-is/adonis-autoswagger) to add information about your endpoints.
