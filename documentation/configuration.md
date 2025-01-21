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
  proxyUrl: 'https://proxy.example.com'
}
```

You can use our hosted proxy:

```js
{
  proxyUrl: 'https://proxy.scalar.com'
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

Whether to show the “Download OpenAPI Document” button

`@default false`

```js
{
  hideDownloadButton: true
}
```

#### hideTestRequestButton?: boolean

Whether to show the “Test Request” button

`@default false`

```js
{
  hideTestRequestButton: true
}
```

#### hideSearch?: boolean

Whether to show the sidebar search bar

`@default false`

```js
{
  hideSearch: true
}
```

#### darkMode?: boolean

Whether dark mode is on or off initially (light mode)

```js
{
  darkMode: true
}
```

#### forceDarkModeState?: 'dark' | 'light'

forceDarkModeState makes it always this state no matter what

```js
{
  forceDarkModeState: 'dark'
}
```

#### hideDarkModeToggle?: boolean

Whether to show the dark mode toggle

```js
{
  hideDarkModeToggle: true
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

#### baseServerURL?: string

If you want to prefix all relative servers with a base URL, you can do so here.

```js
{
  baseServerURL: 'https://scalar.com'
}
```

#### servers?: Server[]

Pass a list of servers to override the servers in your OpenAPI document.

```js
{
  servers: [
    {
      url: 'https://api.scalar.com',
      description: 'Production',
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

#### favicon?: string

You can specify the path to a favicon to be used for the documentation.

```js
{
  favicon: '/favicon.svg'
}
```

#### defaultHttpClient?: HttpClientState

By default, we’re using Shell/curl as the default HTTP client. Or, if that’s disabled (through `hiddenClients`), we’re just using the first available HTTP client.

You can explicitly set the default HTTP client, though:

```js
{
  defaultHttpClient: {
    targetKey: 'node',
    clientKey: 'undici',
  }
}
```

#### hiddenClients?: array | true

We’re generating code examples for a long list of popular HTTP clients. You can control which are shown by passing an array of clients, to hide the given clients.

Pass an empty array `[]` to show all available clients.

```js
{
  hiddenClients: []
}
```

Pass an array of individual clients to hide just those clients.

```js
{
  hiddenClients: ['fetch']
}
```

Here’s a list of all clients that you can potentially hide:

```js
{
  hiddenClients: ['libcurl', 'clj_http', 'httpclient', 'restsharp', 'native', 'http1.1', 'asynchttp', 'nethttp', 'okhttp', 'unirest', 'xhr', 'axios', 'fetch', 'jquery', 'okhttp', 'native', 'request', 'unirest', 'axios', 'fetch', 'nsurlsession', 'cohttp', 'curl', 'guzzle', 'http1', 'http2', 'webrequest', 'restmethod', 'python3', 'requests', 'httr', 'native', 'curl', 'httpie', 'wget', 'nsurlsession', 'undici'],
}
```

But you can also pass `true` to **hide all** HTTP clients. If you have any custom code examples (`x-scalar-examples`) in your API definition, these still render.

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

#### generateHeadingSlug?: (heading: Heading) => string

Customize how heading URLs are generated. This function receives the heading and returns a string ID that controls the entire URL hash.

> Note: This must be passed through JavaScript, setting a data attribute will not work.

```js
// Default behavior - results in hash: #description/heading-slug
{
  generateHeadingSlug: (heading) => `#description/${heading.slug}`
}

// Custom example
{
  generateHeadingSlug: (heading) => `#custom-section/${heading.slug}`
}
```

#### generateModelSlug?: (model: { name: string }) => string

Customize how model URLs are generated. This function receives the model object and returns a string ID. Note that `model/` will automatically be prepended to the result.

> Note: This must be passed through JavaScript, setting a data attribute will not work.

```js
// Default behavior - results in hash: #model/model-name
{
  generateModelSlug: (model) => slug(model.name)
}

// Custom example - results in hash: #model/custom-prefix-model-name
{
  generateModelSlug: (model) => `custom-prefix-${model.name.toLowerCase()}`
}
```

#### generateTagSlug?: (tag: Tag) => string

Customize how tag URLs are generated. This function receives the tag object and returns a string ID. Note that `tag/` will automatically be prepended to the result.

> Note: This must be passed through JavaScript, setting a data attribute will not work.

```js
// Default behavior - results in hash: #tag/tag-name
{
  generateTagSlug: (tag) => slug(tag.name)
}

// Custom example - results in hash: #tag/v1-tag-name
{
  generateTagSlug: (tag) => `v1-${tag.name.toLowerCase()}`
}
```

#### generateOperationSlug?: (operation: Operation) => string

Customize how operation URLs are generated. This function receives the operation object containing `path`, `operationId`, `method`, and `summary`. Note that `tag/tag-name/` will automatically be prepended to the result.

> Note: This must be passed through JavaScript, setting a data attribute will not work.

```js
// Default behavior - results in hash: #tag/tag-name/post-path
{
  generateOperationSlug: (operation) => `${operation.method}${operation.path}`
}

// Custom example - results in hash: #tag/tag-name/v1-post-users
{
  generateOperationSlug: (operation) =>
    `v1-${operation.method.toLowerCase()}-${operation.path.replace('/', '-')}`
}
```

#### generateWebhookSlug?: (webhook: { name: string; method?: string }) => string

Customize how webhook URLs are generated. This function receives the webhook object containing the name and an optional HTTP method. Note that `webhook/` will automatically be prepended to the result.

> Note: This must be passed through JavaScript, setting a data attribute will not work.

````js
// Default behavior - results in hash: #webhook/webhook-name
{
  generateWebhookSlug: (webhook) => slug(webhook.name)
}

// Custom example - results in hash: #webhook/v1-post-user-created
{
  generateWebhookSlug: (webhook) => `v1-${webhook.method?.toLowerCase()}-${webhook.name}`
}

#### withDefaultFonts?: boolean

By default we’re using Inter and JetBrains Mono, served by Google Fonts. If you use a different font or just don’t want to use Google Fonts, pass `withDefaultFonts: false` to the configuration.

```js
{
  withDefaultFonts: false
}
````

#### defaultOpenAllTags?: boolean

By default we only open the relevant tag based on the url, however if you want all the tags open by default then set this configuration option :)

```js
{
  defaultOpenAllTags: true
}
```

#### tagsSorter?: 'alpha' | (a: Tag, b: Tag) => number

Sort tags alphanumerically (`'alpha'`):

```js
{
  tagsSorter: 'alpha'
}
```

Or specify a custom function to sort the tags.

> Note: Most of our integrations pass the configuration as JSON and you can’t use custom sort functions there. It will work in Vue, Nuxt, React, Next and all integrations that don’t need to pass the configuration as a JSON string.

```js
{
  /** @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort */
  tagsSorter: (a, b) => {
    if (a.name === 'Super Important Tag') return -1
    return 1
  }
}
```

Learn more about Array sort functions: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort

#### operationsSorter?: 'alpha' | 'method' | ((a: TransformedOperation, b: TransformedOperation) => number)

```js
{
  operationsSorter: 'alpha'
}
```

Or specify a custom function to sort the operations.

```js
{
  operationsSorter: (a, b) => {
    const methodOrder = ['GET', 'POST', 'PUT', 'DELETE']
    const methodComparison = methodOrder.indexOf(a.httpVerb) - methodOrder.indexOf(b.httpVerb)

    if (methodComparison !== 0) {
      return methodComparison
    }

    return a.path.localeCompare(b.path)
  },
}
```

#### theme?: string

You don’t like the color scheme? We’ve prepared some themes for you:

Can be one of: **alternate**, **default**, **moon**, **purple**, **solarized**, **bluePlanet**, **saturn**, **kepler**, **mars**, **deepSpace**, **none**

```js
{
  theme: 'default'
}
```

#### hideClientButton?: boolean

Whether to show the client button from the reference sidebar and modal

`@default false`

```js
{
  hideClientButton: true
}
```
