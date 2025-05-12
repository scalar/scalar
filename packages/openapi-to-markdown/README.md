# Scalar OpenAPI to Markdown

[![Version](https://img.shields.io/npm/v/%40scalar/openapi-to-markdown)](https://www.npmjs.com/package/@scalar/openapi-to-markdown)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/openapi-to-markdown)](https://www.npmjs.com/package/@scalar/openapi-to-markdown)
[![License](https://img.shields.io/npm/l/%40scalar%2Fopenapi-to-markdown)](https://www.npmjs.com/package/@scalar/openapi-to-markdown)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

A Node.js package to generate LLM-friendly Markdown from OpenAPI documents.

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

## Community

We are API nerds. You too? Let’s chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
