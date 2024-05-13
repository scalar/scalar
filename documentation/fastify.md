# Scalar API Reference for Fastify

Fastify is a pretty popular server for Node.js, a lot of people consider it to be the modern successor of Express. Anyway, if you’re working with Fastify, there’s great support for the OpenAPI standard. And with our package you can render an interactive API reference with just a few additional lines of code.

## Create a new Fastify project (optional)

If you’re starting ~~on a white sheet of paper~~ fresh, let’s install Fastify first:

```bash
npm init
npm install fastify
```

To actually use it, we need to create a JavaScript file (`index.js`):

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

If you start to run this script, it’ll fail though, because we’re newing the “new” way to _import_ EcmaScript Modules here. Anyway, the fix should be straight-forward. We need to add the highlighted lines to our package.json:

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

This should output the URL the server is running on: <http://127.0.0.1:3000> Try opening this in your browser and you should see the example JSON.

Congratulations, you’ve set up your (first?) Fastify project!

## Set up Fastify Swagger (optional)

Wait … _Swagger_, isn’t that the outdated standard? Yes, you’re right! Anyway, this is what the offical package is called to generate OpenAPI 3.0 files.

In order to use it, we need to install the offical package first:

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
    reply.send({ hello: `Hello ${req.body.hello}` })
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

I cross my fingers for you, but this should give you a pretty decent OpenAPI file on <http://127.0.0.1:3000/openapi.json>

Did it work? OMG, this is so cool! It didn’t? [Create a new issue](https://github.com/scalar/scalar/issues/new/choose) so we can improve this guide here — I mean, that’s the beauty of open source, isn’t it?

## Render your OpenAPI reference with Scalar

Congratulations, you’ve come really far. And I have good news for you, you’re just a few lines of code away from a stunning API reference for your Fastify project. Time to pull our package:

```
npm install @scalar/fastify-api-reference
```

Put the following snippet into your `index.js` right before the `await fastify.ready`

```js
// …
// Render the API reference
import ScalarApiReference from '@scalar/fastify-api-reference'

await fastify.register(ScalarApiReference, {
  routePrefix: '/reference',
})

// …
```

_Note: It’s not really a problem to have an `import` statement in the middle of your file, it’s not really common, though. Feel free to move it to the top of your files, where `import` statements usually live._

Wow, this is it already. Restart the server, if it didn’t already and take a look at your new API reference:

<http://127.0.0.1:3000/reference>

That’s it, you made it! You can keep adding routes to Fastify now and the reference will keep in sync with them.

## Customize everything (optional)

You can customize a ton! Just pass a `configuration` object to the plugin:

```js
import ScalarApiReference from '@scalar/fastify-api-reference'

await fastify.register(ScalarApiReference, {
  routePrefix: '/reference',
  configuration: {
    layout: 'classic',
    // Learn more about configuration:
    // https://github.com/scalar/scalar/tree/main/packages/api-reference#configuration
  },
})
```

TypeScript should give you a nice autocomplete for all options. If you’re more into reading an actual reference, you can read about all options here: <https://github.com/scalar/scalar/tree/main/packages/api-reference#configuration>

## Advanced: Handcrafted OpenAPI files

Auto-generated OpenAPI files are great, but some OpenAPI purists argue it’s worth to handcraft your OpenAPI files. If you’re one of them, feel free to just pass an URL to your existing OpenAPI file:

> Note: If you don’t use `@fastify/swagger` to generate and serve an OpenAPI specification, you need to serve it
> manually. [To serve static files, try @fastify/static](https://github.com/fastify/fastify-static).

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
