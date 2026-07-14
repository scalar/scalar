# Scalar OpenAPI to Markdown

[![Version](https://img.shields.io/npm/v/%40scalar/openapi-to-markdown)](https://www.npmjs.com/package/@scalar/openapi-to-markdown)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/openapi-to-markdown)](https://www.npmjs.com/package/@scalar/openapi-to-markdown)
[![License](https://img.shields.io/npm/l/%40scalar%2Fopenapi-to-markdown)](https://www.npmjs.com/package/@scalar/openapi-to-markdown)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

A Node.js package to generate LLM-friendly Markdown from OpenAPI documents.

---

Scalar is an open-source API platform for teams who want beautiful developer interfaces without vendor lock-in.

- **[API References](https://scalar.com/products/api-references/getting-started)** — Interactive API documentation from OpenAPI and AsyncAPI specs.
- **[Docs](https://scalar.com/products/docs/getting-started)** — Write in Markdown/MDX, generate API references, sync with two-way Git.
- **[SDKs](https://scalar.com/products/sdks/getting-started)** — Type-safe client libraries in TypeScript, Python, Go, PHP, Java, and Ruby.
- **[MCP Servers](https://scalar.com/products/agent/getting-started)** — Generate secure MCP servers from your API spec.
- **[API Client](https://scalar.com/products/api-client/getting-started)** — Open-source, offline-first Postman alternative built on OpenAPI.

20M+ monthly npm installs · 15,500+ GitHub stars · MIT licensed · [scalar.com](https://scalar.com)

---

## Installation

```bash
npm install @scalar/openapi-to-markdown
```

## Usage

```ts
import { createMarkdownFromOpenApi } from '@scalar/openapi-to-markdown'

const content = {
  openapi: '3.1.1',
  info: {
    title: 'My API',
    version: '1.0',
  },
  paths: {
    // …
  },
}

// Generate Markdown from an OpenAPI document
const markdown = await createMarkdownFromOpenApi(content)

// Generate Markdown for a single operation
const operationMarkdown = await createMarkdownFromOpenApi(content, {
  operation: {
    operationId: 'getUser',
  },
})

// You can also select by path + method
const operationMarkdownByPath = await createMarkdownFromOpenApi(content, {
  operation: {
    path: '/users/{id}',
    method: 'get',
  },
})

// Or use a full JSON pointer to the operation object
const operationMarkdownByPointer = await createMarkdownFromOpenApi(content, {
  operation: {
    pointer: '#/paths/~1users~1{id}/get',
  },
})
```

### With Hono

You use the package with any Node.js framework. Here is an example for [Hono](https://hono.dev/):

```ts
import { Hono } from 'hono'
import { createMarkdownFromOpenApi } from '@scalar/openapi-to-markdown'

// Generate Markdown from an OpenAPI document
const markdown = await createMarkdownFromOpenApi(content)

const app = new Hono()

/**
 * Register a route to serve the Markdown for LLMs
 *
 * Q: Why /llms.txt?
 * A: It's a proposal to standardise on using an /llms.txt file.
 *
 * @see https://llmstxt.org/
 */
app.get('/llms.txt', (c) => c.text(markdown))

serve(app)
```

### Generate HTML

This is not really the purpose of the package, but maybe good to know: This package actually renders HTML at first, and
transforms the HTML to Markdown then.

So if you'd like to have a really light-weight HTML API Reference, here you are:

```ts
import { Hono } from 'hono'
import { createHtmlFromOpenApi } from '@scalar/openapi-to-markdown'

// Generate HTML from an OpenAPI document
const html = await createHtmlFromOpenApi(content)

const app = new Hono()

app.get('/', (c) =>
  c.html(
    `<!doctype html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <title>Scalar Galaxy</title>
  <!-- Basic styling for semantic HTML tags (optional) -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css">
</head>
<body>
  <main class="container">
    ${html}
  </main>
</body>
</html>`,
  ),
)

serve(app)
```

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
