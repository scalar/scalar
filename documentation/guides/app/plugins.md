# Client Plugins

Extend the API Client with custom behavior using the `ClientPlugin` interface. Plugins can add lifecycle hooks, custom UI components, and custom response body handlers for content types the client does not natively support.

## Using a Plugin

Pass plugins when creating the API Client:

```typescript
import { createApiClientApp } from '@scalar/api-client/app'
import type { ClientPlugin } from '@scalar/oas-utils/helpers'

const myPlugin: ClientPlugin = {
  // ...
}

createApiClientApp(el, {
  layout: 'web',
  plugins: [myPlugin],
})
```

## Custom Response Body Handling

When your API returns a content type the client does not natively support (for example, MessagePack), you can register a `responseBody` handler to decode and display it:

```typescript
import type { ClientPlugin } from '@scalar/oas-utils/helpers'

const msgpackPlugin: ClientPlugin = {
  responseBody: [
    {
      mimeTypes: ['application/msgpack', 'application/x-msgpack'],
      decode: async (buffer) => {
        const { decode } = await import('@msgpack/msgpack')
        const decoded = decode(new Uint8Array(buffer))
        return JSON.stringify(decoded, null, 2)
      },
      language: 'json',
    },
  ],
}

createApiClientApp(el, {
  layout: 'web',
  plugins: [msgpackPlugin],
})
```

Each handler in `responseBody` supports:

| Property | Description |
|---|---|
| `mimeTypes` | MIME type patterns to match (exact or wildcard like `application/vnd.*+json`). |
| `decode` | Transforms the raw `ArrayBuffer` into a string or Blob for display. |
| `language` | CodeMirror language hint for the built-in raw renderer (for example, `json`). Mutually exclusive with `rawComponent`. |
| `rawComponent` | A custom Vue component for the raw view. Mutually exclusive with `language`. |
| `previewComponent` | A custom Vue component for the preview view. |

## Lifecycle Hooks

Plugins can hook into the request lifecycle:

```typescript
const loggingPlugin: ClientPlugin = {
  hooks: {
    beforeRequest: ({ requestBuilder }) => {
      requestBuilder.headers.set('X-Custom-Header', 'value')
    },
    responseReceived: ({ response }) => {
      console.log('Response status:', response.status)
    },
  },
}
```
