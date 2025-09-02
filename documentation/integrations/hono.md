# Scalar API Reference for Hono

This middleware provides an easy way to render a beautiful API reference based on an OpenAPI/Swagger document with Hono.

![Screenshot of the Hono integration](/screenshots/hono.png)

## Installation

```bash
npm install @scalar/hono-api-reference
```

## Usage

Set up [Zod OpenAPI Hono](https://github.com/honojs/middleware/tree/main/packages/zod-openapi) or [Hono OpenAPI](https://github.com/rhinobase/hono-openapi) and pass the configured URL to the `Scalar` middleware:

```ts
import { Hono } from 'hono'
import { Scalar } from '@scalar/hono-api-reference'

const app = new Hono()

// Use the middleware to serve the Scalar API Reference at /scalar
app.get('/scalar', Scalar({ url: '/doc' }))

// Or with dynamic configuration
app.get('/scalar', Scalar((c) => {
  return {
    url: '/doc',
    proxyUrl: c.env.ENVIRONMENT === 'development' ? 'https://proxy.scalar.com' : undefined,
  }
}))

export default app
```

The Hono middleware takes our universal configuration object, [read more about configuration](https://guides.scalar.com/scalar/scalar-api-references/configuration) in the core package README.

### Themes

The middleware comes with a custom theme for Hono. You can use one of [the other predefined themes](https://github.com/scalar/scalar/blob/main/packages/themes/src/index.ts#L15) (`alternate`, `default`, `moon`, `purple`, `solarized`) or overwrite it with `none`. All themes come with a light and dark color scheme.

```ts
import { Scalar } from '@scalar/hono-api-reference'

// Switch the theme (or pass other options)
app.get('/scalar', Scalar({
  url: '/doc',
  theme: 'purple',
}))
```

### Custom page title

There's one additional option to set the page title:

```ts
import { Scalar } from '@scalar/hono-api-reference'

// Set a page title
app.get('/scalar', Scalar({
  url: '/doc',
  pageTitle: 'Awesome API',
}))
```

### Custom CDN

You can use a custom CDN, default is `https://cdn.jsdelivr.net/npm/@scalar/api-reference`.

You can also pin the CDN to a specific version by specifying it in the CDN string like `https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.25.28`

You can find all available CDN versions [here](https://www.jsdelivr.com/package/npm/@scalar/api-reference?tab=files)

```ts
import { Scalar } from '@scalar/hono-api-reference'

app.get('/scalar', Scalar({ url: '/doc', pageTitle: 'Awesome API' }))

app.get('/scalar', Scalar({
  url: '/doc',
  cdn: 'https://cdn.jsdelivr.net/npm/@scalar/api-reference@latest',
}))
```

### Markdown for LLMs

If you want to create a Markdown version of the API reference (for LLMs), install `@scalar/openapi-to-markdown`:

```bash
npm install @scalar/openapi-to-markdown
```

And add an additional route for it:

```ts
import { Hono } from 'hono'
import { createMarkdownFromOpenApi } from '@scalar/openapi-to-markdown'

const app = new Hono()

// Generate Markdown from your OpenAPI document
const markdown = await createMarkdownFromOpenApi(content)

/**
 * Register a route to serve the Markdown for LLMs
 *
 * Q: Why /llms.txt?
 * A: It's a proposal to standardise on using an /llms.txt file.
 *
 * @see https://llmstxt.org/
 */
app.get('/llms.txt', (c) => c.text(markdown))

export default app
```

Or, if you are using Zod OpenAPI Hono:

```ts
// Get the OpenAPI document
const content = app.getOpenAPI31Document({
  openapi: '3.1.0',
  info: { title: 'Example', version: 'v1' },
})

const markdown = await createMarkdownFromOpenApi(JSON.stringify(content))

app.get('/llms.txt', async (c) => {
  return c.text(markdown)
})
```
