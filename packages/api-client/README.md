# Scalar API Client

[![Version](https://img.shields.io/npm/v/%40scalar/api-client)](https://www.npmjs.com/package/@scalar/api-client)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/api-client)](https://www.npmjs.com/package/@scalar/api-client)
[![License](https://img.shields.io/npm/l/%40scalar%2Fapi-client)](https://www.npmjs.com/package/@scalar/api-client)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

The Scalar API Client is a powerful tool designed to simplify API testing and integration. This versatile package offers multiple usage options:

- standalone application for quick and easy API testing
- embeddable component in various frontend environments
- customizable module that can be integrated into existing projects

## ⚠️ Breaking Changes

We have removed the old version of the clients so you must update your imports as seen below. We will keep the v2 exports for a while then remove them.

## Features

- Intuitive interface for sending API requests and viewing responses
- Support for multiple authentication methods
- Real-time request/response logging
- Customizable request headers and parameters
- Response visualization and formatting options

## Installation

```bash
npm install @scalar/api-client
```

## Usage

### App

You can mount the full-blown API Client to your DOM like this:

```html
<!-- index.html -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0" />
    <title>Scalar API Client App</title>
  </head>
  <body>
    <div
      id="scalar-client"
      class="scalar-app scalar-client"></div>
    <script
      type="module"
      src="./main.js"></script>
  </body>
</html>
```

```ts
// main.js
import '@/style.css'

import { createApiClientApp } from '@scalar/api-client/app'

const el = document.getElementById('scalar-client')

createApiClientApp(el, { layout: 'web' })
```

### Modal

Or you can mount a more compact version, which is rendered in a modal.
You must initialize the workspace store and add at least one document.

```ts
// main.js
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createApiClientModal } from '@scalar/api-client/modal'

import '@/style.css'

const workspaceStore = createWorkspaceStore()
await workspaceStore.addDocument({
  name: 'default',
  url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
})

const modal = createApiClientModal({
  el: document.getElementById('app'),
  workspaceStore,
  options: {
    proxyUrl: 'https://proxy.scalar.com',
  },
})

// Open the API client right-away
modal.open()

document.getElementById('button')?.addEventListener('click', () =>
  modal.open({
    path: '/user/signup',
    method: 'post',
  }),
)

// Navigate while the modal is already open
modal.route({
  path: '/me',
  method: 'get',
})

// Merge options at runtime
modal.updateOptions({
  hideClientButton: true,
})

```

## Configuration

`createApiClientModal` accepts these top-level properties:

| Option | Description |
|---|---|
| `el` | [Required] The HTML element to mount the modal app to. |
| `workspaceStore` | [Required] An initialized workspace store with documents loaded. |
| `mountOnInitialize` | Mount immediately (default: `true`). Set to `false` to mount manually later. |
| `eventBus` | Pass an existing workspace event bus, or let the modal create one. |
| `plugins` | Client plugins to include in the modal. |
| `options` | Partial API client configuration for modal behavior (see below). |

`options` supports these keys:

| Option | Description |
|---|---|
| `options.proxyUrl` | Use a proxy URL to send requests when CORS blocks direct browser requests. |
| `options.authentication` | Prefill authentication credentials and default security scheme behavior. |
| `options.baseServerURL` | Prefix all relative servers with a base URL. |
| `options.hideClientButton` | Hide the client button in modal-based integrations. |
| `options.hiddenClients` | Control which HTTP code-example clients are shown; pass `[]` to show all clients. |
| `options.oauth2RedirectUri` | Set the default OAuth 2.0 redirect URI for auth code and implicit flows. |
| `options.servers` | Override the servers from your OpenAPI document. |

## Available Methods

The `createApiClientModal` call returns:

- `open(payload?)`: Opens the modal and optionally navigates to a route.
- `route(payload)`: Navigates to a route without toggling modal visibility.
- `updateOptions(nextOptions, overwrite?)`: Merges options by default, or replaces them when `overwrite` is `true`.
- `mount(mountingEl?)`: Mounts the modal app to a specific element.
- `modalState`: Reactive open/close state object.
- `app`: Underlying Vue app instance.

`open` and `route` use this payload shape:

```ts
{
  path: string
  method: HttpMethod
  example?: string
  documentSlug?: string // For multiple documents
}
```


## Plugins

The `plugins` option accepts an array of `ClientPlugin` objects that extend the API Client with custom behavior. Plugins can add lifecycle hooks, custom UI components, and custom response body handlers for content types that the client does not natively support.

### Custom Response Body Handling

When your API returns a non-standard content type (for example, MessagePack), you can register a plugin with a `responseBody` handler to decode and display it:

```ts
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
| `language` | CodeMirror language hint for the built-in raw renderer (for example, `json`). |
| `rawComponent` | A custom Vue component for the raw view (mutually exclusive with `language`). |
| `previewComponent` | A custom Vue component for the preview view. |

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
