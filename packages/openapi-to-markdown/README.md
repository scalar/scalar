# Scalar OpenAPI to Markdown

[![Version](https://img.shields.io/npm/v/%40scalar/openapi-to-markdown)](https://www.npmjs.com/package/@scalar/openapi-to-markdown)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/openapi-to-markdown)](https://www.npmjs.com/package/@scalar/openapi-to-markdown)
[![License](https://img.shields.io/npm/l/%40scalar%2Fopenapi-to-markdown)](https://www.npmjs.com/package/@scalar/openapi-to-markdown)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

A Node.js package to generate LLM-friendly Markdown from OpenAPI documents.

---

Scalar is an open-source API platform for teams who want beautiful developer interfaces without vendor lock-in.

- **[API References](https://scalar.com/products/api-references/getting-started)** — Interactive API documentation from OpenAPI and AsyncAPI specs.
- **[Developer Docs](https://scalar.com/products/docs/getting-started)** — Write in Markdown/MDX, generate API references, sync with two-way Git.
- **[SDK Generator](https://scalar.com/products/sdk-generator/getting-started)** — Type-safe SDKs and CLIs in TypeScript, Python, Go, PHP, Java, and Ruby.
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

### Render multiple pages

Create a reusable renderer when exporting several pages from the same API description.
It loads, upgrades, coerces, and resolves the document once. Each call uses the same selectors as
`createMarkdownFromOpenApi`, and omitting a selector renders the complete document.

```ts
import { createOpenApiMarkdownRenderer } from '@scalar/openapi-to-markdown'

const renderer = await createOpenApiMarkdownRenderer(content)

const introduction = await renderer.render({ introduction: true })
const operation = await renderer.render({
  operation: { path: '/users/{id}', method: 'get' },
})
const tag = await renderer.render({ tag: 'Users' })
const model = await renderer.render({ model: 'User' })
const webhook = await renderer.render({
  webhook: { name: 'userCreated', method: 'post' },
})
```

The factory accepts the same document objects, JSON/YAML strings, file paths, and URLs
as the one-shot functions. Source files and URLs are read during creation, including
references. Create a new renderer when the source changes. Reuse one renderer per API
description during a build, then release it when the build finishes. Renderers do not
share a global document cache. An invalid selection rejects that call without preventing
later calls on the same renderer.

### With Hono

You use the package with any Node.js framework. Here is an example for [Hono](https://hono.dev/):

```ts
import { createMarkdownFromOpenApi } from '@scalar/openapi-to-markdown'
import { Hono } from 'hono'

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

### Markdown rendering

The renderer constructs a Markdown syntax tree directly from the resolved API description.
It preserves Markdown descriptions, GFM tables and code blocks without rendering a Vue app
or converting the generated document through HTML. Descriptions containing raw HTML or
Scalar alerts use a separate sanitization and conversion path. Images remain excluded.

Each schema property is one line with its name, type and annotations, for example
`` **`archived_at` (required)**: `string | null`, format: `date-time` ``, followed by
its description with its paragraphs, links and code blocks intact. Nullable unions,
single-branch `allOf` wrappers and unions of plain types are labelled as one type.
Parameters are listed by location. Responses that return the same schema and media
type share one entry, such as a list of error statuses. Security schemes are
summarized on one line, and an Authentication section appears only when the API
description declares requirements.

Schema normalization and description parsing are cached within each renderer. Recursive
schema expansion still tracks ancestors and stops at a depth of ten. Output may use tighter
list spacing and normalized Markdown escaping compared with earlier versions.

The package only generates Markdown. To produce HTML, pass the Markdown output to a
Markdown renderer in your application.

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).

## Individual reference pages

`createMarkdownFromOpenApi` and `renderer.render` accept the same selection options. Choose one selector per call:

```ts
await createMarkdownFromOpenApi(content, { tag: 'pets' })
await createMarkdownFromOpenApi(content, { model: 'Pet' })
await createMarkdownFromOpenApi(content, {
  webhook: { name: 'petCreated', method: 'post' },
})
await createMarkdownFromOpenApi(content, { introduction: true })
await createMarkdownFromOpenApi(content, {
  operation: { operationId: 'getUser' },
})
```

- **Operation:** One operation, effective parameters, servers and authentication, its tags, and referenced component schemas. Existing path/method, operation ID, and JSON pointer selectors still work. Methods are case insensitive.
- **Tag:** Tag metadata and all path operations with that exact tag, plus their context and schema dependencies. A tag used only by operations is supported. A declared tag with no operations renders its metadata. Operations with multiple tags appear once, with only the selected tag shown.
- **Model:** One component schema and its referenced schemas. Primitive, array, composed, and recursive models use the shared schema renderer.
- **Webhook:** One operation selected by its exact OpenAPI webhook name and method, including parameters, payload and responses. The name is a label, not a delivery URL.
- **Introduction:** API title, versions, description, contact, license, terms of service, servers and global authentication requirements. No operations, tags, models or webhooks.

An operation, webhook or model page starts with that item as its `#` title, with its sections (parameters, request body, responses) as `##` headings. It leaves out the API title, versions and description, which belong on the introduction page. Tag and whole-document exports keep the document header. Selected pages exclude unrelated reference content. Operation servers override path servers, which override document servers. Operation security overrides document security, including `security: []` for anonymous access. Parameter overrides use the parameter name and location. Required schemas are collected after reference resolution, so dependencies remain available even when their original section is omitted.

Omitting options, or passing `{}`, renders the whole document. OpenAPI 2.0 inputs are migrated before selection: use definition names with `model`. Webhooks require OpenAPI 3.1 or later.

Whole-document exports render each named structured schema once under `## Schemas`.
Operations and nested properties link to that section, while simple primitive references
remain inline. Generated explicit anchors keep links stable even when schema titles repeat.
The export is self-contained; a supplied `schemaReferences.resolveUrl` callback still controls
reference URLs when linked mode is explicitly requested.

Within a whole-document export, repeated generated examples link to their first
occurrence. Request, response, and media-type contexts remain distinct. Synthesized
values are labeled **Generated example**, and authored examples remain at every
usage, including all values in a schema's `examples` array.

Global servers and authentication are documented once. Operations link to inherited
defaults and show their own overrides in full. Path-level servers are explained at
their first use and linked thereafter, including variable defaults, choices, and
descriptions. Explicit empty server overrides use `/`; explicit `security: []` remains
anonymous. Absent security requirements do not imply anonymous access.

### Errors and limitations

Invalid, combined, or missing selectors reject the returned promise with an error. Duplicate operation IDs are ambiguous and list matching paths and methods; use a path/method selector instead. Duplicate tag declarations are also rejected. Names are case sensitive. Operation JSON pointers must target `/paths/{path}/{method}`, with an optional leading `#` and standard `~0`/`~1` escaping.

Selection does not add support for every OpenAPI or JSON Schema keyword. Callbacks are not selectable pages. External references follow the existing workspace loader behavior. Recursive schema expansion stops on a repeated ancestor, with a depth limit of ten as a fallback. Shared dependencies are expanded once per page, where they are first used. The `## Schemas` section lists a component the page already expanded on one line, with its title and any description that a reference sibling replaced, and keeps a full section for the selected model, for leaf schemas, for models the page has not expanded yet, and for object models with authored examples. Authentication lists alternatives separately; schemes within one requirement must be used together.

### Copying Markdown in the browser

Use the browser entry point with an OpenAPI document already resolved by
`@scalar/workspace-store`. It supports the same page selectors as the default
entry point, without file loading or HTML minification.

```ts
const { createMarkdownFromOpenApi } =
  await import('@scalar/openapi-to-markdown/browser')

const markdown = await createMarkdownFromOpenApi(document, {
  operation: { path: '/users/{id}', method: 'get' },
})
```

Use the default entry point for raw JSON, YAML, URLs, or file paths that still need
loading, migration, and reference resolution.

### Link shared schemas on individual pages

The default renderer expands shared schemas and includes the schemas needed by a
selected page. For large API descriptions, opt into `schemaReferences.mode:
'linked'` to expand the root schema of each parameter, request, response, or model
and replace nested `$ref` occurrences with links. Inline schemas continue to
render, including composition branches and reference siblings. Operation and
webhook pages do not collect or append transitive models; a model page includes
only the selected model.

The documentation generator supplies published URLs. The renderer does not assume
any routing convention:

```ts
import { createOpenApiMarkdownRenderer } from '@scalar/openapi-to-markdown'

const renderer = await createOpenApiMarkdownRenderer(apiDescription)
// Build this map from the pages your generator actually publishes.
const modelUrls = new Map([
  ['account', '/reference/models/account'],
  ['customer', '/reference/models/customer'],
])
const markdown = await renderer.render({
  operation: { path: '/v1/account', method: 'get' },
  schemaReferences: {
    mode: 'linked',
    resolveUrl: ({ name }) => modelUrls.get(name),
  },
})
```

The callback receives the original reference string (`ref`) and its decoded
component name (`name`). For references outside `#/components/schemas/{name}`,
`name` is the reference string. Returning `undefined`, an empty URL, or an unsafe
URL retains the schema name as text. Omitting the callback has the same fallback.
References remain visible even when no destination page exists.

Use the same option with `{ model: 'account' }`, `{ webhook: { name: 'event',
method: 'post' } }`, the one-shot `createMarkdownFromOpenApi`, or the browser entry
point. The browser entry point still requires a workspace-resolved document.
Options and URL callbacks are isolated per render, including concurrent renders.

References to primitive, enum and `const` schemas, and to aliases of them, are
written in place, because their whole definition fits on one line. Pass
`inlinePrimitives: false` to link them too. Object, array and composition schemas
are always linked.

Linked mode uses authored media-type and schema examples and does not generate
examples on operation pages, which would expand every linked schema. A model page
generates an example for its own schema, with linked schemas left as empty
stubs. Authored examples are not capped in size. Inline schema content and authored
text also remain proportional to the source; this mode bounds traversal across
shared references, not the byte size of arbitrary authored content. Root
composition branches that contain references link to those schemas rather than
flattening their constraints. Full-document exports still include every model
section; use a page selector for individual exports.
