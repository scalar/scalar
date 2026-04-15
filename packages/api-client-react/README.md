# Scalar API Client React

[![Version](https://img.shields.io/npm/v/%40scalar/api-client-react)](https://www.npmjs.com/package/@scalar/api-client-react)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/api-client-react)](https://www.npmjs.com/package/@scalar/api-client-react)
[![License](https://img.shields.io/npm/l/%40scalar%2Fapi-client-react)](https://www.npmjs.com/package/@scalar/api-client-react)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

## Installation

```bash
npm install @scalar/api-client-react
```

## ⚠️ Breaking Changes

We have updated the API for the client! Please see the new hook based usage below.

## Usage

Call `useApiClient()` from any component. No provider is needed.

The Vue app is created once and appended to `document.body` where it lives for the lifetime of the
page — it survives client-side navigation without losing state.

The code is ESM lazy loaded with the dynamic import function to make the smallest possible initial bundle size. We also
handle de-duplication of documents so as long as the URL is the same you will only get one.

```tsx
import { useApiClient } from '@scalar/api-client-react'
import '@scalar/api-client-react/style.css'

export const OpenButton = () => {
  const client = useApiClient({
    configuration: {
      url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
    },
  })

  return (
    <button onClick={() => client?.open({ path: '/planets', method: 'get' })}>
      Open API Client
    </button>
  )
}
```

### Options

For the complete list of configuration options, see the [Scalar configuration docs](https://scalar.com/products/api-references/configuration).

| Option | Description |
|---|---|
| `configuration.url` | [Required] Pass the URL of an OpenAPI document (JSON or YAML). |
| `configuration.proxyUrl` | Use a proxy URL to send requests to other origins when CORS blocks direct browser requests. |
| `configuration.authentication` | Prefill authentication credentials and default security scheme behavior for users. |
| `configuration.baseServerURL` | Prefix all relative servers with a base URL. |
| `configuration.hideClientButton` | Whether to hide the client button from the reference sidebar and modal. |
| `configuration.hiddenClients` | Control which HTTP code-example clients are shown; pass `[]` to show all clients. |
| `configuration.oauth2RedirectUri` | Set the default OAuth 2.0 redirect URI for authorization code and implicit flows. |
| `configuration.servers` | Pass a list of servers to override the servers in your OpenAPI document. |

<!-- | `configuration.content` | `Record<string, unknown>` | Inline OpenAPI document object | -->

### Routing to a specific request

Pass a `RoutePayload` to `client.open()` to navigate directly to a specific endpoint:

```tsx
const client = useApiClient({
  configuration: { url: '...' },
})

// Open to a specific request
client?.open({ path: '/auth/token', method: 'post' })
```

Check out the playground for a working example.

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
