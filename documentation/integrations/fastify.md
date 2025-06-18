# Scalar API Reference for Fastify

The easiest way to render a beautiful API reference with Fastify. All based on your OpenAPI/Swagger document.

[![Screenshot of an API Reference](https://github.com/scalar/scalar/assets/6201407/d8beb5e1-bf64-4589-8cb0-992ba79215a8)](https://docs.scalar.com/swagger-editor)

## Installation

```bash
npm install @scalar/fastify-api-reference
```

And then register it with Fastify:

```ts
await fastify.register(import('@scalar/fastify-api-reference'), {
  routePrefix: '/reference',
})
```

## Usage

If you have a OpenAPI/Swagger document already, you can pass an URL to the plugin:

```ts
// Render an API reference for a given OpenAPI/Swagger spec URL
fastify.register(import('@scalar/fastify-api-reference'), {
  routePrefix: '/reference',
  configuration: {
    title: 'Our API Reference',
    url: '/openapi.json',
  },
})
```

With [@fastify/swagger], we’re picking it up automatically, so this would be enough:

```ts
await fastify.register(import('@scalar/fastify-api-reference'), {
  routePrefix: '/reference',
})
```

We wrote a [detailed integration guide for Fastify](https://github.com/scalar/scalar/tree/main/documentation/integrations/fastify.md).

The fastify plugin takes our universal configuration object, [read more about configuration](https://github.com/scalar/scalar/tree/main/documentation/configuration.md) in the core package README.

## Themes

By default, we’re using a custom Fastify theme and it’s beautiful. But you can choose [one of our other themes](https://github.com/scalar/scalar/tree/main/packages/themes), too:

```ts
await fastify.register(import('@scalar/fastify-api-reference'), {
  routePrefix: '/reference',
  configuration: {
    theme: 'purple',
  },
})
```

## Logging

The plugin is compatible with the Fastify logger. You can configure the log level for the routes registered by the plugin:

```ts
fastify.register(import('@scalar/fastify-api-reference'), {
  routePrefix: '/reference',
  logLevel: 'silent',
})
```

## Guide

Fastify is a pretty popular server for Node.js, a lot of people consider it to be the modern successor of Express. Anyway, if you’re working with Fastify, there’s great support for the OpenAPI standard. And with our package you can render an interactive API reference with just a few additional lines of code.

### Create a new Fastify project (optional)

If you’re starting ~~on a white sheet of paper~~ fresh, let’s install Fastify first:

```bash
npm init
npm install fastify
```

Then, to use it, we need to create a JavaScript file (`index.js`):

```js
// index.js
import Fastify from 'fastify'

// Instantiate the framework
const fastify = Fastify({
  logger: true,
})

// Declare a route
fastify.get('/', function (request, reply) {
  reply.send({ hello: 'world' })
})

// Run the server
fastify.listen({ port: 3000 }, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }

  console.log(`Fastify is now listening on ${address}`)
})
```

If you start to run this script, it’ll fail though, because we’re using the “new” way to _import_ EcmaScript Modules here. The fix should be straight-forward. We need to add the highlighted lines to our package.json:

```diff
{
  "name": "my-fastify-app",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
+ "type": "module",
  "scripts": {
+    "dev": "npx nodemon index.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  …
}
```

The `"type": "module"` is important to make Node work with the “new” EcmaScript Modules. The `dev` script is just for convenience. The other lines of your package.json might look different, that’s okay.

Time to run it:

```bash
npm run dev
```

This should output the URL the server is running on: <http://localhost:3000> Try opening this in your browser and you should see the example JSON.

Congratulations, you’ve set up your (first?) Fastify project!

### Set up Fastify Swagger (optional)

Wait … _Swagger_, isn’t that the outdated standard? Yes, you’re right! Rest assured, this is what the official package is called to generate OpenAPI 3.0 files.

In order to use it, we need to install the official package first:

```bash
npm install @fastify/swagger
```

Okay, you’ve got this. To actually set up the package, there’s a some boilerplate code required. **Replace the content** of our previous `index.js` with the following:

```js
import FastifySwagger from '@fastify/swagger'
import Fastify from 'fastify'

// Instantiate the framework
const fastify = Fastify({
  logger: true,
})

// Set up @fastify/swagger
await fastify.register(FastifySwagger, {
  openapi: {
    info: {
      title: 'My Fastify App',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        apiKey: {
          type: 'apiKey',
          name: 'apiKey',
          in: 'header',
        },
      },
    },
  },
})

fastify.put(
  '/example-route/:id',
  {
    schema: {
      description: 'post some data',
      tags: ['user', 'code'],
      summary: 'qwerty',
      security: [{ apiKey: [] }],
      params: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'user id',
          },
        },
      },
      body: {
        type: 'object',
        properties: {
          hello: { type: 'string' },
          obj: {
            type: 'object',
            properties: {
              some: { type: 'string' },
            },
          },
        },
      },
      response: {
        201: {
          description: 'Succesful response',
          type: 'object',
          properties: {
            hello: { type: 'string' },
          },
        },
        default: {
          description: 'Default response',
          type: 'object',
          properties: {
            foo: { type: 'string' },
          },
        },
      },
    },
  },
  (req, reply) => {
    reply.code(201).send({ hello: `Hello ${req.body.hello}` })
  },
)

// Serve an OpenAPI file
fastify.get('/openapi.json', async (request, reply) => {
  return fastify.swagger()
})

// Wait for Fastify
await fastify.ready()

// Run the server
fastify.listen({ port: 3000 }, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }

  console.log(`Fastify is now listening on ${address}`)
})
```

Oh, that’s a ton, right? Here’s the TL;DR of what it does:

1. Register the Swagger plugin
2. Define a few global things, like the name of your API
3. Register a route with an example OpenAPI definition for that route
4. Add a route that returns just the generated OpenAPI as a JSON file

Your server should be restarted automatically (that’s what we added `nodemon` in the `package.json` for). If you haven’t already set up something like `nodemon` to restart your process, you need to manually do this:

```bash
npm run dev
```

If all went well, this should give you a pretty decent OpenAPI file on <http://localhost:3000/openapi.json>

Did it work? OMG, this is so cool! It didn’t? [Create a new issue](https://github.com/scalar/scalar/issues/new/choose) so we can improve this guide here — I mean, that’s the beauty of open source, isn’t it?

### Render your OpenAPI reference with Scalar

Congratulations, you’ve come really far. And I have good news for you, you’re just a few lines of code away from a stunning API reference for your Fastify project. Time to pull our package:

```bash
npm install @scalar/fastify-api-reference
```

Put the following snippet into your `index.js` right before the `await fastify.ready`

```js
// …
// Render the API reference
import ScalarApiReference from '@scalar/fastify-api-reference'

await fastify.register(ScalarApiReference, {
  routePrefix: '/reference',
  // Additional hooks for the API reference routes. You can provide the onRequest and preHandler hooks
  hooks: {
    onRequest: function (request, reply, done) {
      done()
    },
    preHandler: function (request, reply, done) {
      done()
    },
  },
})

// …
```

:::scalar-callout{ type=info }
It’s not really a problem to have an `import` statement in the middle of your file, it’s not really common, though. Feel free to move it to the top of your files, where `import` statements usually live.
:::

Wow, this is it already. Restart the server, if it didn’t already and take a look at your new API reference:

<http://localhost:3000/reference>

That’s it, you made it! You can keep adding routes to Fastify now and the reference will keep in sync with them.

For Additional hooks you can learn more about [route's options](https://fastify.dev/docs/latest/Reference/Routes/#routes-options) interface.

### Customize everything (optional)

You can customize a ton! Just pass a `configuration` object to the plugin:

```js
import ScalarApiReference from '@scalar/fastify-api-reference'

await fastify.register(ScalarApiReference, {
  routePrefix: '/reference',
  configuration: {
    layout: 'classic',
    // Learn more about configuration:
    // https://github.com/scalar/scalar/tree/main/documentation/configuration.md
  },
})
```

TypeScript should give you a nice autocomplete for all options. If you’re more into reading an actual reference, you can read about all options here: <https://github.com/scalar/scalar/tree/main/documentation/configuration.md>

### Advanced: Handcrafted OpenAPI files

Auto-generated OpenAPI files are great, but some OpenAPI purists argue it’s worth to handcraft your OpenAPI files. If you’re one of them, feel free to just pass an URL to your existing OpenAPI file:

:::scalar-callout{ type=info }
If you don’t use `@fastify/swagger` to generate and serve an OpenAPI specification, you need to serve it manually. [To serve static files, try @fastify/static](https://github.com/fastify/fastify-static).
:::

```js
import ScalarApiReference from '@scalar/fastify-api-reference'

await fastify.register(ScalarApiReference, {
  routePrefix: '/reference',
  configuration: {
    // On your domain:
    url: '/openapi.json',
    // Or somewhere else:
    // url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
  },
})
```
