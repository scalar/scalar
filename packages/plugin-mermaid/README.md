# @scalar/plugin-mermaid

Renders [Mermaid](https://mermaid.js.org/) diagrams for any `x-mermaid` specification extension in
the Scalar API Reference — flowcharts, sequence diagrams, state diagrams, anything Mermaid supports.

## Why a separate package

Scalar's core bundle does not ship Mermaid — a fenced ` ```mermaid ` code block only ever adds
~3MB for documents that never use one. This plugin uses the existing [plugin
API](https://github.com/scalar/scalar/blob/main/packages/types/src/api-reference/api-reference-plugin.ts)'s
specification-extension mechanism instead: `mermaid` is a dependency of this package alone, and even
within it the library is dynamically imported only when a document actually carries an `x-mermaid`
value and the API Reference mounts a component for it. Consumers who never install or register this
plugin pay nothing; documents that never use `x-mermaid` pay nothing either.

## Install

```bash
npm install @scalar/plugin-mermaid
```

## Usage

```ts
import { createApiReference } from '@scalar/api-reference'
import { createMermaidPlugin } from '@scalar/plugin-mermaid'

createApiReference('#app', {
  url: '/openapi.json',
  plugins: [createMermaidPlugin()],
})
```

Add `x-mermaid` to any object in the description that Scalar renders through the specification
extension mechanism — `info`, a tag, an operation, and so on:

```yaml
paths:
  /orders:
    post:
      summary: Place an order
      x-mermaid: |
        sequenceDiagram
          Client->>API: POST /orders
          API->>Client: 201 Created
```

The diagram renders in place, adapts to light/dark color mode, and re-renders on a color-mode
change.

## Styling

The plugin ships a small stylesheet for the diagram container and the error message. It is not
required — the diagram itself renders without it — but if your bundler does not pick it up
automatically, import it once:

```ts
import '@scalar/plugin-mermaid/style.css'
```
