# Configuration

You can pass a — what we call — universal configuration object to fine-tune your API reference.

## Universal Configuration

It is universal, because it works in all environments. You can pass it to the JS API directly, or you can use it in one
of our integrations.

Let’s say you are working with just an HTML file, that’s how you pass the configuration:

```ts
Scalar.createApiReference('#app', {
  // Your configuration goes here…
  url: '…'
})
```

Or — just as an example — in the Hono server framework you would pass the same configuration like this:

```ts
app.get(
  '/doc',
  apiReference({
    // Your configuration goes here…
    url: '…'
  }),
)
```

## OpenAPI documents

There is just one thing that is really required to render at least something: The content.

There are a bunch of ways to pass your OpenAPI document:

### URL

Pass an absolute or relative URL to your OpenAPI document.

```ts
Scalar.createApiReference('#app', {
  url: '/openapi.json'
})
```

This can be JSON or YAML.

It’s the recommended way to pass your OpenAPI document. In most cases, the OpenAPI document can be cached by the browser
and subsequent requests are pretty fast then, even if the document grows over time.

> No OpenAPI document? All backend frameworks have some kind of OpenAPI generator. Just
> search for "yourframework generate openapi document".

### Content

> While this approach is convenient for quick setup, it may impact performance for large documents.
> For optimal performance with extensive OpenAPI specifications, consider using a URL to an external OpenAPI document
> instead.

You can just directly pass JSON/YAML content:

```ts
Scalar.createApiReference('#app', {
  content: `{
    "openapi": "3.1.0",
    "info": {
      "title": "Hello World",
      "version": "1.0.0"
    },
    "paths": {
      // …
    }
  }`
})
```

### Multiple Documents

Add multiple OpenAPI documents to render all of them. We will need a slug and title to distinguish them in the UI and in
the URL. You can just omit those attributes, and we will try our best to still distinguish them, though.

```ts
Scalar.createApiReference('#app', {
  sources: [
    // API #1
    {
      title: 'Scalar Galaxy', // optional, would fallback to 'API #1'
      slug: 'scalar-galaxy', // optional, would be auto-generated from the title or the index
      url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
    },
    // API #2
    {
      url: 'https://example.com/openapi.json',
    },
    // API #3
    {
      content: '{ "openapi": "3.1.1", … }',
    }
  ]
})
```

The first one in the list is the default one. Sometimes, this list is auto-generated and you might want to explicitly
set the default like this:

```ts
Scalar.createApiReference('#app', {
  sources: [
    // API #1
    {
      url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
    },
    // API #2
    {
      url: 'https://example.com/openapi.json',
      // This will make it the default OpenAPI document:
      default: true,
    }
  ]
})
```

### Multiple Configurations

Sometimes, you want to modify the configuration for your OpenAPI documents. And the good news is: You can.

Pass an array of configurations to render multiple documents with specific configurations:

```ts
Scalar.createApiReference('#app', [
  // Configuration #1
  {
    title: 'Scalar Galaxy', // optional, would fallback to 'API #1'
    slug: 'scalar-galaxy', // optional, would be auto-generated from the title or the index
    url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
    customCss: `body { background-color: #BADA55}`
  },
  // Configuration #2
  {
    url: 'https://example.com/openapi.json',
    customCss: `body { background-color: #c0ffee}`
  },
  // Configuration #3
  {
    content: '{ "openapi": "3.1.1", … }',
    customCss: `body { background-color: #facade}`
  }
])
```

By default, the first one in the list will be the default configuration. You can explicitly set one with `default: true`:

```ts
Scalar.createApiReference('#app', [
  {
    url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
  },
  {
    url: 'https://example.com/openapi.json',
  },
  {
    // Make this the default configuration:
    default: true,
    content: '{ "openapi": "3.1.1", … }',
  }
])
```


### Multiple Configurations with Sources (Advanced)

You can even combine multiple configurations that each have their own set of sources. This gives you maximum flexibility in organizing and configuring your API documents:

```ts
Scalar.createApiReference('#app', [
  // Configuration #1
  {
    // With sources! 🤯
    sources: [
      // API #1
      {
        url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
      },
      // API #2
      {
        url: 'https://example.com/openapi.json',
        // This will make it the default OpenAPI document:
        default: true,
      }
    ]
  },
  // Configuration #2
  {
    url: 'https://example.com/openapi.json',
  },
  // Configuration #3
  {
    sources: [
      {
        content: '{ "openapi": "3.1.1", … }',
      }
    ]
  }
])
```

### JSON or YAML

It is completely up to you whether you want to pass JSON or YAML. None of the differences make really a big difference,
but here is a short overview:

* JSON is faster to parse for the browser
* JSON is supported natively in basically any environment
* YAML is easier to write, especially if you want multiline text (for example for descriptions)
* YAML is easier to read for humans
* YAML documents tend to be a little bit smaller

## List of all attributes

### content?: string | Record<string, any> | () => Record<string, any>

Directly pass an OpenAPI/Swagger document (JSON or YAML) as a string:

```js
{
  content: '{ "openapi": "3.1.1" }'
}
```

Or as a JavaScript object:

```js
{
  content: {
    openapi: '3.1.1',
  }
}
```

Or as a callback returning the actual document:

```js
{
  content() {
    return {
      openapi: '3.1.1',
    }
  }
}
```

### url?: string

Pass the URL of an OpenAPI document (JSON or YAML).

```js
{
  url: '/openapi.json'
}
```

### proxyUrl?: string

Making requests to other domains is restricted in the browser and requires [CORS headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS). It's recommended to use a proxy to send requests to other origins.

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

If you like to run your own, check out our [example proxy written in Go](https://github.com/scalar/scalar/tree/main/projects/proxy-scalar-com).

### plugins?: ApiReferencePlugin[]

Pass an array of custom plugins that you want. As of now, we don’t provide any official plugins (yet).

You can build your own plugins, though. There is an example how to render custom specification extensions:

https://github.com/scalar/scalar/tree/main/packages/api-reference/playground/vue/src/x-custom-extension-plugin/x-custom-extension-plugin.ts

You can add specification extensions (starting with `x-`) to the following objects:

* Info Object
* Tag Object
* Schema Object

You need them in another place? [Create an issue to let us know.](https://github.com/scalar/scalar/issues/new/choose)

```js
{
  plugins: [
    XCustomExtensionPlugin(),
  ],
}
```

### showSidebar?: boolean

Whether the sidebar should be shown.

```js
{
  showSidebar: true
}
```

### hideModels?: boolean

Whether models (`components.schemas` or `definitions`) should be shown in the sidebar, search and content.

`@default false`

```js
{
  hideModels: true
}
```

### hideDownloadButton?: boolean

Whether to show the "Download OpenAPI Document" button

`@default false`

```js
{
  hideDownloadButton: true
}
```

### hideTestRequestButton?: boolean

Whether to show the "Test Request" button

`@default false`

```js
{
  hideTestRequestButton: true
}
```

### hideSearch?: boolean

Whether to show the sidebar search bar

`@default false`

```js
{
  hideSearch: true
}
```

### darkMode?: boolean

Whether dark mode is on or off initially (light mode)

```js
{
  darkMode: true
}
```

### forceDarkModeState?: 'dark' | 'light'

forceDarkModeState makes it always this state no matter what

```js
{
  forceDarkModeState: 'dark'
}
```

### hideDarkModeToggle?: boolean

Whether to show the dark mode toggle

```js
{
  hideDarkModeToggle: true
}
```

### customCss?: string

You can pass custom CSS directly to the component. This is helpful for the integrations for Fastify, Express, Hono and others where you it's easier to add CSS to the configuration.

In Vue or React you'd probably use other ways to add custom CSS.

```js
{
  customCss: `* { font-family: "Comic Sans MS", cursive, sans-serif; }`
}
```

### searchHotKey?: string

Key used with CTRL/CMD to open the search modal (defaults to 'k' e.g. CMD+k)

```js
{
  searchHotKey: 'l'
}
```

### baseServerURL?: string

If you want to prefix all relative servers with a base URL, you can do so here.

```js
{
  baseServerURL: 'https://scalar.com'
}
```

### servers?: Server[]

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

### metaData?: object

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

### favicon?: string

You can specify the path to a favicon to be used for the documentation.

```js
{
  favicon: '/favicon.svg'
}
```

### defaultHttpClient?: HttpClientState

By default, we're using Shell/curl as the default HTTP client. Or, if that's disabled (through `hiddenClients`), we're just using the first available HTTP client.

You can explicitly set the default HTTP client, though:

```js
{
  defaultHttpClient: {
    targetKey: 'node',
    clientKey: 'undici',
  }
}
```

### hiddenClients?: array | true

We're generating code examples for a long list of popular HTTP clients. You can control which are shown by passing an array of clients, to hide the given clients.

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

Here's a list of all clients that you can potentially hide:

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

## onDocumentSelect?: () => void

Triggered when multiple documents are configured and the users switches between them.


### onSpecUpdate?: (spec: string) => void

You can listen to changes with onSpecUpdate that runs on spec/swagger content change

```js
{
  onSpecUpdate: (value: string) => {
    console.log('Content updated:', value)
  }
}
```

### onServerChange?: (server: string) => void

You can listen to changes with onServerChange that runs on server change

```js
{
  onServerChange: (value: string) => {
    console.log('Server updated:', value)
  }
}
```

### authentication?: AuthenticationConfiguration

To make authentication easier you can prefill the credentials for your users:

```ts
{
  authentication: {
    // The OpenAPI file has keys for all security schemes.
    // Specify which security scheme(s) should be used by default.
    // Can be a single string:
    preferredSecurityScheme: 'my_custom_security_scheme',
    // Or an array for multiple schemes (OR relationship):
    preferredSecurityScheme: ['scheme1', 'scheme2'],
    // Or an array of arrays for complex AND/OR relationships:
    preferredSecurityScheme: [['scheme1', 'scheme2'], 'scheme3'],

    // Define security scheme configurations:
    securitySchemes: {
      // For API Key
      apiKeyHeader: {
        name: 'X-API-KEY',
        in: 'header',
        value: 'tokenValue',
      },
      // For HTTP Bearer
      httpBearer: {
        token: 'xyz token value',
      },
      // For HTTP Basic
      httpBasic: {
        username: 'username',
        password: 'password',
      },
      // For OAuth2
      oauth2: {
        flows: {
          authorizationCode: {
            // Provide a token that is used instead of calling the auth provider
            token: 'auth code token',
            // Prefill client id or secret
            'x-scalar-client-id': 'your-client-id',
            clientSecret: 'your-client-secret',
            // Overwrite values from the OpenAPI document
            authorizationUrl: 'https://auth.example.com/oauth2/authorize',
            tokenUrl: 'https://auth.example.com/oauth2/token',
            'x-scalar-redirect-uri': 'https://your-app.com/callback',
            // Use PKCE for additional security: 'SHA-256', 'plain', or 'no'
            'x-usePkce': 'SHA-256',
            // Preselected scopes
            selectedScopes: ['profile', 'email']
          },
          clientCredentials: {
            token: 'client credentials token',
            'x-scalar-client-id': 'your-client-id',
            clientSecret: 'your-client-secret',
            tokenUrl: 'https://auth.example.com/oauth2/token',
            // Preselected scopes
            selectedScopes: ['profile', 'api:read']
          },
          implicit: {
            token: 'implicit flow token',
            'x-scalar-client-id': 'your-client-id',
            authorizationUrl: 'https://auth.example.com/oauth2/authorize',
            'x-scalar-redirect-uri': 'https://your-app.com/callback',
            // Preselected scopes
            selectedScopes: ['openid', 'profile']
          },
          password: {
            token: 'password flow token',
            'x-scalar-client-id': 'your-client-id',
            clientSecret: 'your-client-secret',
            tokenUrl: 'https://auth.example.com/oauth2/token',
            username: 'default-username',
            password: 'default-password',
            selectedScopes: ['profile', 'email']
          },
        },
        // Set default scopes for all flows
        'x-default-scopes': ['profile', 'email']
      }
    },
  }
}
```

The `authentication` configuration accepts:

- `preferredSecurityScheme`: Specifies which security scheme(s) to use by default. Can be:
  - A single security scheme name (string)
  - An array of security scheme names (OR relationship)
  - An array containing strings or arrays of strings (AND/OR relationship)
- `securitySchemes`: An object mapping security scheme names to their configurations. Each security scheme can be configured with type-specific options.

### generateHeadingSlug?: (heading: Heading) => string

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

### generateModelSlug?: (model: { name: string }) => string

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

### generateTagSlug?: (tag: Tag) => string

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

### generateOperationSlug?: (operation: Operation) => string

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

### generateWebhookSlug?: (webhook: { name: string; method?: string }) => string

Customize how webhook URLs are generated. This function receives the webhook object containing the name and an optional HTTP method. Note that `webhook/` will automatically be prepended to the result.

> Note: This must be passed through JavaScript, setting a data attribute will not work.

```js
// Default behavior - results in hash: #webhook/webhook-name
{
  generateWebhookSlug: (webhook) => slug(webhook.name)
}

// Custom example - results in hash: #webhook/v1-post-user-created
{
  generateWebhookSlug: (webhook) =>
    `v1-${webhook.method?.toLowerCase()}-${webhook.name}`
}
```

### onLoaded?: () => void

Callback that triggers as soon as the references are lazy loaded.

> Note: This must be passed through JavaScript, setting a data attribute will not work.

```js
{
  onLoaded: () => {
    console.log('References loaded')
  }
}
```

### withDefaultFonts?: boolean

By default we're using Inter and JetBrains Mono, served from our fonts CDN at `https://fonts.scalar.com`. If you use a different font or just don't want to load web fonts, pass `withDefaultFonts: false` to the configuration.

```js
{
  withDefaultFonts: false
}
```

### defaultOpenAllTags?: boolean

By default we only open the relevant tag based on the url, however if you want all the tags open by default then set this configuration option :)

```js
{
  defaultOpenAllTags: true
}
```

### tagsSorter?: 'alpha' | (a: Tag, b: Tag) => number

Sort tags alphanumerically (`'alpha'`):

```js
{
  tagsSorter: 'alpha'
}
```

Or specify a custom function to sort the tags.

> Note: Most of our integrations pass the configuration as JSON and you can't use custom sort functions there. It will work in Vue, Nuxt, React, Next and all integrations that don't need to pass the configuration as a JSON string.

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

### operationsSorter?: 'alpha' | 'method' | ((a: TransformedOperation, b: TransformedOperation) => number)

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

### theme?: string

You don't like the color scheme? We've prepared some themes for you:

Can be one of: **alternate**, **default**, **moon**, **purple**, **solarized**, **bluePlanet**, **saturn**, **kepler**, **mars**, **deepSpace**, **laserwave**, **none**

```js
{
  theme: 'default'
}
```

### hideClientButton?: boolean

Whether to show the client button from the reference sidebar and modal

`@default false`

```js
{
  hideClientButton: true
}
```
