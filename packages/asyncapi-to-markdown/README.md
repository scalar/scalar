# Scalar AsyncAPI to Markdown

Generate LLM-friendly Markdown from AsyncAPI descriptions without rendering HTML or Vue.

```sh
npm install @scalar/asyncapi-to-markdown
```

```ts
import {
  createAsyncApiMarkdownRenderer,
  createMarkdownFromAsyncApi,
} from '@scalar/asyncapi-to-markdown'

const markdown = await createMarkdownFromAsyncApi('./asyncapi.yaml')

// Load, upgrade and bundle references once for a documentation build.
const renderer = await createAsyncApiMarkdownRenderer('./asyncapi.yaml')
await renderer.render() // Complete description
await renderer.render({ introduction: true })
await renderer.render({ channel: 'orders' })
await renderer.render({ operation: 'receiveOrder' })
await renderer.render({ message: 'OrderCreated' })
await renderer.render({ model: 'Order' })
await renderer.render({ tag: 'Orders' })
await renderer.render({
  message: { pointer: '#/channels/orders/messages/created' },
})
```

The Node.js entry point accepts objects, JSON/YAML strings, file paths, and HTTP(S) URLs.
Relative external references resolve against the source file or URL. Object and inline
string inputs need absolute external references. AsyncAPI 1.0–1.2, 2.0–2.6, 3.0 and 3.1
inputs use Scalar's upgrader to produce a 3.1 document. The original version stays visible
in the introduction. Input objects are not modified. Create a new renderer to pick up
source changes; rendering pages does not fetch the source again.

Choose at most one selector per call. Strings identify exact, case-sensitive map keys:
channels, operations, component messages, or component schemas. Channel addresses and
human-readable titles are not selectors. Every map selector also accepts an exact JSON
pointer, with optional `#` and standard `~0` / `~1` escaping. Message pointers can select
channel messages as well as component messages. Invalid or missing selections reject
that call; the renderer remains usable afterward.

Operation pages include the channel address, parameters, relevant servers, security,
selected messages, and reply details. Channel pages include their operations and all
channel messages. Selected pages expand each shared schema once and include transitive schema dependencies.
Introduction pages contain API metadata and servers. Complete exports include channels,
operations, component messages and schemas. Send/receive direction is from the described
application's perspective; legacy publish/subscribe operations are migrated accordingly.

Message and operation traits are merged before rendering. Authored examples are preserved.
Missing examples are generated from JSON schemas and labelled by context (**Generated headers example** or
**Generated payload example**). XML payloads use XML examples, while headers use JSON. Repeated generated
examples link to their first occurrence within the same media type and context. JSON Schema and AsyncAPI schemas include properties,
required markers, constraints, composition and recursive-reference notices. Other schema
formats, such as Avro and Protobuf, appear as labelled source blocks. Protocol bindings
are preserved as JSON. Descriptions preserve Markdown, tables and code blocks using the
same sanitization as the OpenAPI converter; images are excluded.

## Navigation and shared models

Complete exports include a contents index with explicit anchors. Shared structured
models render once and their usages link to that definition. Repeated servers and
security schemes also link to their first occurrence. Primitive schemas remain inline.
Schema display normalization and description parsing are cached per prepared renderer.

Tag pages match exact tag names on channels, operations (including traits), and messages.
A channel tag includes the channel's operations and messages. An operation tag includes
that operation's context. Tags declared in `info.tags` retain descriptions and external links,
even when unused. Tag pages retain the API introduction, display only the selected tag, and link to
messages already rendered on the page. Unknown or duplicate tag declarations reject the render.

For documentation sites that publish model pages separately:

```ts
await renderer.render({
  operation: 'receiveOrder',
  schemaReferences: {
    mode: 'linked',
    resolveUrl: ({ name }) => `/models/${encodeURIComponent(name)}`,
    inlinePrimitives: true,
  },
})
```

Linked pages expand root schemas and replace nested structured references with published
links. Returning `undefined` or omitting the callback keeps the model name as plain text.
Set `inlinePrimitives: false` to link primitive, enum and const references too.
Linked pages omit the transitive appendix and generated message examples. Selected model
pages still generate a local example with linked structured dependencies left as stubs.
Authored examples remain available in linked mode. URL callbacks receive the original reference and
its model name, preserving aliases. Empty or unsafe URLs render an unlinked name. Composition
branches retain their model links.

## Browser

Use a document already upgraded and resolved by `@scalar/workspace-store`:

```ts
import { createMarkdownFromAsyncApi } from '@scalar/asyncapi-to-markdown/browser'

const markdown = await createMarkdownFromAsyncApi(document, {
  operation: 'receiveOrder',
})
```

The browser entry point does not read files, fetch references, or upgrade raw documents.

## Limitations

This is a documentation converter, not a validator. Unsupported versions, failed loads,
and unresolved references needed for rendering reject with an error. Recursive schema
expansion stops at a repeated ancestor, ten levels, or 5,000 schema nodes per expansion,
with a visible notice. Generated examples exceeding 10,000 estimated values are omitted
with a visible notice. Custom schema
vocabularies are not interpreted, and output is not a replacement for the original schema.
Publishing Markdown routes and adding copy buttons to Scalar Docs are separate integrations.

## Playground and benchmarks

Run `pnpm --filter @scalar/asyncapi-to-markdown dev --port 3002 --strictPort`.
The playground includes local order events and a shared-schema stress fixture, page
selection and search, linked/full export modes, sanitized previews, Markdown source,
copy/download controls, output size and render timing. Click a published model link to
open that model page. It runs conversion in a worker to keep the UI responsive.

Run `pnpm --filter @scalar/asyncapi-to-markdown benchmark` for repeatable preparation,
cold/warm rendering, output size, and RSS measurements. See [the benchmark method](./benchmarks/README.md).
