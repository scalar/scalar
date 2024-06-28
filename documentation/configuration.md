# Configuration

There’s a universal configuration object that can be used on all platforms.

#### isEditable?: boolean

Whether the Swagger editor should be shown.

```js
{
  isEditable: true
}
```

#### spec.content?: string

Directly pass an OpenAPI/Swagger spec.

```js
{
  spec: {
    content: '{ … }'
  }
}
```

#### spec.url?: string

Pass the URL of a spec file (JSON or Yaml).

```js
{
  spec: {
    url: '/openapi.json'
  }
}
```

#### proxyUrl?: string

Making requests to other domains is restricted in the browser and requires [CORS headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS). It’s recommended to use a proxy to send requests to other origins.

```js
{
  proxy: 'https://proxy.example.com'
}
```

You can use our hosted proxy:

```js
{
  proxy: 'https://proxy.scalar.com'
}
```

If you like to run your own, check out our [example proxy written in Go](https://github.com/scalar/scalar/tree/main/examples/proxy-server).

#### showSidebar?: boolean

Whether the sidebar should be shown.

```js
{
  showSidebar: true
}
```

#### hideModels?: boolean

Whether models (`components.schemas` or `definitions`) should be shown in the sidebar, search and content.

`@default false`

```js
{
  hideModels: true
}
```

#### hideDownloadButton?: boolean

Whether to show the "Download OpenAPI Specification" button

`@default false`

```js
{
  hideDownloadButton: true
}
```

### customCss?: string

You can pass custom CSS directly to the component. This is helpful for the integrations for Fastify, Express, Hono and others where you it’s easier to add CSS to the configuration.

In Vue or React you’d probably use other ways to add custom CSS.

```js
{
  customCss: `* { font-family: "Comic Sans MS", cursive, sans-serif; }`
}
```

#### searchHotKey?: string

Key used with CTRL/CMD to open the search modal (defaults to 'k' e.g. CMD+k)

```js
{
  searchHotKey: 'l'
}
```

#### servers?: Server[]

List of servers to override the openapi spec servers

@default undefined
@example [{ url: 'https://api.scalar.com', description: 'Production server' }]

```js
{
  servers: [
    {
      url: 'https://api.scalar.com',
      description: 'Production server',
    },
  ]
}
```

#### metaData?: object

You can pass information to the config object to configure meta information out of the box.

```js
{
  metaData: {
    title: 'Page title',
    description: 'My page page',
    ogDescription: 'Still about my my page',
    ogTitle: 'Page title',
    ogImage: 'https://example.com/image.png',
    twitterCard: 'summary_large_image',
    // Add more...
  }
}
```

#### hiddenClients?: array | true

You can pass an array of [httpsnippet clients](https://github.com/Kong/httpsnippet/wiki/Targets) to hide from the clients menu.

```js
{
  hiddenClients: ['fetch']
}
```

By default hides Unirest, pass `[]` to **show** all clients or `true` to **hide** all clients:

```js
{
  hiddenClients: true
}
```

#### onSpecUpdate?: (spec: string) => void

You can listen to spec changes with onSpecUpdate that runs on spec/swagger content change

```js
{
  onSpecUpdate: (value: string) => {
    console.log('Content updated:', value)
  }
}
```

#### authentication?: Partial<AuthenticationState>

To make authentication easier you can prefill the credentials for your users:

```js
{
  authentication: {
    // The OpenAPI file has keys for all security schemes:
    // Which one should be used by default?
    preferredSecurityScheme: 'my_custom_security_scheme',
    // The `my_custom_security_scheme` security scheme is of type `apiKey`, so prefill the token:
    apiKey: {
      token: 'super-secret-token',
    },
  },
}
```

For OpenAuth2 it’s more looking like this:

```js
{
  authentication: {
    // The OpenAPI file has keys for all security schemes
    // Which one should be used by default?
    preferredSecurityScheme: 'oauth2',
    // The `oauth2` security scheme is of type `oAuth2`, so prefill the client id and the scopes:
    oAuth2: {
    clientId: 'foobar123',
    // optional:
    scopes: ['read:planets', 'write:planets'],
    },
  },
}
```

#### withDefaultFonts?: boolean

By default we’re using Inter and JetBrains Mono, served by Google Fonts. If you use a different font or just don’t want to use Google Fonts, pass `withDefaultFonts: false` to the configuration.

```js
{
  withDefaultFonts: false
}
```

#### theme?: string

You don’t like the color scheme? We’ve prepared some themes for you:

Can be one of: **alternate**, **default**, **moon**, **purple**, **solarized**, **bluePlanet**, **saturn**, **kepler**, **mars**, **deepSpace**, **none**

```js
{
  theme: default
}
```
