# Configuration

You can pass a - what we call universal - configuration object to fine-tune your API reference.

> **Note:** This page covers the runtime configuration object for the Scalar API Reference used to control how Scalar displays your API docs.
>
> This is NOT the `scalar.config.json` (used for the [Scalar Docs](guides/docs/configuration/scalar.config.json.md)).


## Universal Configuration

It is universal, because it works in all environments. You can pass it to the JS API directly, or you can use it in one of our integrations.

Let's say you are working with just an HTML file, that's how you pass the configuration:

```javascript
Scalar.createApiReference('#app', {
  // Your configuration goes here…
  url: '…'
})
```

Or — just as an example — in the Hono server framework, you would pass the same configuration like this:

```javascript
app.get(
  '/doc',
  Scalar({
    // Your configuration goes here…
    url: '…'
  }),
)
```

## OpenAPI Documents

There is just one thing that is really required to render at least something: The content.

There are a bunch of ways to pass your OpenAPI document:

### URL

Pass an absolute or relative URL to your OpenAPI document.

```javascript
Scalar.createApiReference('#app', {
  url: '/openapi.json'
})
```

This can be JSON or YAML.

It's the recommended way to pass your OpenAPI document. In most cases, the OpenAPI document can be cached by the browser and subsequent requests are pretty fast then, even if the document grows over time.

> No OpenAPI document? All backend frameworks have some kind of OpenAPI generator. Just search for "yourframework generate openapi document".

### Content

> While this approach is convenient for quick setup, it may impact performance for large documents. For optimal performance with extensive OpenAPI specifications, consider using a URL to an external OpenAPI document instead.

You can just directly pass JSON/YAML content:

```javascript
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

Add multiple OpenAPI documents to render all of them. We will need a slug and title to distinguish them in the UI and in the URL. You can just omit those attributes, and we will try our best to still distinguish them, though.

```javascript
Scalar.createApiReference('#app', {
  sources: [
    // API #1
    {
      title: 'Scalar Galaxy', // optional, would fallback to 'API #1'
      slug: 'scalar-galaxy', // optional, would be auto-generated from the title or the index
      url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
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

The first one in the list is the default one. Sometimes, this list is auto-generated and you might want to explicitly set the default like this:

```javascript
Scalar.createApiReference('#app', {
  sources: [
    // API #1
    {
      url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
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

```javascript
Scalar.createApiReference('#app', [
  // Configuration #1
  {
    title: 'Scalar Galaxy', // optional, would fallback to 'API #1'
    slug: 'scalar-galaxy', // optional, would be auto-generated from the title or the index
    url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
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

```javascript
Scalar.createApiReference('#app', [
  {
    url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
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

```javascript
Scalar.createApiReference('#app', [
  // Configuration #1
  {
    // With sources! 🤯
    sources: [
      // API #1
      {
        url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
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

It is completely up to you whether you want to pass JSON or YAML. None of the differences make really a big difference, but here is a short overview:

* JSON is faster to parse for the browser
* JSON is supported natively in basically any environment
* YAML is easier to write, especially if you want multiline text (for example for descriptions)
* YAML is easier to read for humans
* YAML documents tend to be a little bit smaller

## Agent Scalar

Agent Scalar adds an AI chat interface to your API reference. Users can ask questions about your API and get contextual answers based on your OpenAPI document.

- Enabled by default on `http://localhost` for testing (10 free messages)
- Won’t appear in production unless a key is provided
- Requires an [Agent Scalar key](guides/agent/key.md) for production deployments
- Your OpenAPI document is uploaded on first message

Related: [How to get an Agent Scalar key](guides/agent/key.md)

```js
Scalar.createApiReference('#app', {
  sources: [
    {
      url: 'https://registry.scalar.com/@your-namespace/apis/your-api/latest?format=json',
      agent: {
        key: 'put-your-agent-scalar-key-here',
      },
    },
  ],
})
```

To disable Agent Scalar:

```js
Scalar.createApiReference('#app', {
  // Disable Agent Scalar entirely
  agent: {
    disabled: true,
  },
})
```

## Configuration Options

### Properties

Configuration properties to customize the behavior and appearance of your API reference.

#### authentication

**Type:** `AuthenticationConfiguration`

To make authentication easier you can prefill the credentials for your users:

```javascript
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
            selectedScopes: ['profile', 'email'],
            // Set additional query parameters for the Authorization request
            'x-scalar-security-query': {
              prompt: 'consent',
              audience: 'scalar'
            },
            // Set additional body parameters for the Token request
            'x-scalar-security-body': {
              audience: 'scalar'
            },
            // Custom token name for non-standard OAuth2 responses (default: 'access_token')
            'x-tokenName': 'custom_access_token',
            // Specify where OAuth2 credentials should be sent: 'header' or 'body'
            'x-scalar-credentials-location': 'header'
          },
          clientCredentials: {
            token: 'client credentials token',
            'x-scalar-client-id': 'your-client-id',
            clientSecret: 'your-client-secret',
            tokenUrl: 'https://auth.example.com/oauth2/token',
            // Preselected scopes
            selectedScopes: ['profile', 'api:read'],
            // Custom token name for non-standard OAuth2 responses (default: 'access_token')
            'x-tokenName': 'custom_access_token',
            // Specify where OAuth2 credentials should be sent: 'header' or 'body'
            'x-scalar-credentials-location': 'body'
          },
          implicit: {
            token: 'implicit flow token',
            'x-scalar-client-id': 'your-client-id',
            authorizationUrl: 'https://auth.example.com/oauth2/authorize',
            'x-scalar-redirect-uri': 'https://your-app.com/callback',
            // Preselected scopes
            selectedScopes: ['openid', 'profile'],
            // Custom token name for non-standard OAuth2 responses (default: 'access_token')
            'x-tokenName': 'custom_access_token'
          },
          password: {
            token: 'password flow token',
            'x-scalar-client-id': 'your-client-id',
            clientSecret: 'your-client-secret',
            tokenUrl: 'https://auth.example.com/oauth2/token',
            username: 'default-username',
            password: 'default-password',
            selectedScopes: ['profile', 'email'],
            // Custom token name for non-standard OAuth2 responses (default: 'access_token')
            'x-tokenName': 'custom_access_token',
            // Specify where OAuth2 credentials should be sent: 'header' or 'body'
            'x-scalar-credentials-location': 'header'
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

#### baseServerURL

**Type:** `string`

If you want to prefix all relative servers with a base URL, you can do so here.

```javascript
{
  baseServerURL: 'https://scalar.com'
}
```

#### content

**Type:** `string | Record<string, any> | () => Record<string, any>`

Directly pass an OpenAPI/Swagger document (JSON or YAML) as a string:

```javascript
{
  content: '{ "openapi": "3.1.1" }'
}
```

Or as a JavaScript object:

```javascript
{
  content: {
    openapi: '3.1.1',
  }
}
```

Or as a callback returning the actual document:

```javascript
{
  content() {
    return {
      openapi: '3.1.1',
    }
  }
}
```

#### customCss

**Type:** `string`

You can pass custom CSS directly to the component. This is helpful for the integrations for Fastify, Express, Hono and others where it's easier to add CSS to the configuration.

In Vue or React you'd probably use other ways to add custom CSS.

```javascript
{
  customCss: `* { font-family: "Comic Sans MS", cursive, sans-serif; }`
}
```

#### darkMode

**Type:** `boolean`

Whether dark mode is on or off initially (light mode).

**Default:** `false`

```javascript
{
  darkMode: true
}
```

#### defaultHttpClient

**Type:** `HttpClientState`

By default, we're using Shell/curl as the default HTTP client. Or, if that's disabled (through `hiddenClients`), we're just using the first available HTTP client.

**Default:** `{ targetKey: 'shell', clientKey: 'curl' }`

You can explicitly set the default HTTP client, though:

```javascript
{
  defaultHttpClient: {
    targetKey: 'node',
    clientKey: 'undici',
  }
}
```

#### defaultOpenAllTags

**Type:** `boolean`

By default we only open the relevant tag based on the url, however if you want all the tags open by default then set this configuration option.

**Default:** `false`

```javascript
{
  defaultOpenAllTags: true
}
```

#### documentDownloadType

**Type:** `'json' | 'yaml' | 'both' | 'direct' | 'none'`

Sets the file type of the document to download, set to `'none'` to hide the download button.

**Default:** `'both'`

```javascript
{
  documentDownloadType: 'json'
}
```

When `'direct'` is passed, it just outputs a regular link to the passed URL.

#### expandAllModelSections

**Type:** `boolean`

By default the models are all closed in the model section at the bottom, this flag will open them all by default.

**Default:** `false`

```javascript
{
  expandAllModelSections: true
}
```

#### expandAllResponses

**Type:** `boolean`

By default response sections are closed in the operations. This flag will open them by default.

**Default:** `false`

```javascript
{
  expandAllResponses: true
}
```

#### favicon

**Type:** `string`

You can specify the path to a favicon to be used for the documentation.

```javascript
{
  favicon: '/favicon.svg'
}
```

#### forceDarkModeState

**Type:** `'dark' | 'light'`

Force dark mode to always be this state no matter what.

```javascript
{
  forceDarkModeState: 'dark'
}
```

#### hideClientButton

**Type:** `boolean`

Whether to show the client button from the reference sidebar and modal.

**Default:** `false`

```javascript
{
  hideClientButton: true
}
```

#### hideDarkModeToggle

**Type:** `boolean`

Whether to show the dark mode toggle.

**Default:** `false`

```javascript
{
  hideDarkModeToggle: true
}
```

#### showOperationId

**Type:** `boolean`

Every operation can have a `operationId`, a unique string used to identify the operation, but it's optional.

By default we don't render it in the UI. If it's helpful to show it to your users, enable it like this:

**Default:** `false`

```javascript
{
  showOperationId: true
}
```

#### hideModels

**Type:** `boolean`

Whether models (`components.schemas` or `definitions`) should be shown in the sidebar, search and content.

**Default:** `false`

```javascript
{
  hideModels: true
}
```

#### hideSearch

**Type:** `boolean`

Whether to show the sidebar search bar.

**Default:** `false`

```javascript
{
  hideSearch: true
}
```

#### hideTestRequestButton

**Type:** `boolean`

Whether to show the "Test Request" button.

**Default:** `false`

```javascript
{
  hideTestRequestButton: true
}
```

#### hiddenClients

**Type:** `array | true | object`

We're generating code examples for a long list of popular HTTP clients. You can control which are shown by passing an array of clients, to hide the given clients.

Pass an empty array `[]` to show all available clients:

```javascript
{
  hiddenClients: []
}
```

Pass an array of individual clients to hide just those clients:

```javascript
{
  hiddenClients: ['fetch']
}
```

Here's a list of all clients that you can potentially hide:

<!-- AUTO-GENERATED:CLIENTS START -->
<!-- This section is automatically generated. Do not edit manually. -->
<!-- Source: packages/snippetz/src/clients/index.ts -->
<!-- Generator: packages/snippetz/scripts/generate-markdown-docs.ts -->

```javascript
{
  hiddenClients: {
    // C
    c: ['libcurl'],
    // Clojure
    clojure: ['clj_http'],
    // C#
    csharp: ['httpclient', 'restsharp'],
    // Dart
    dart: ['http'],
    // F#
    fsharp: ['httpclient'],
    // Go
    go: ['native'],
    // HTTP
    http: ['http1.1'],
    // Java
    java: ['asynchttp', 'nethttp', 'okhttp', 'unirest'],
    // JavaScript
    js: ['axios', 'fetch', 'jquery', 'ofetch', 'xhr'],
    // Kotlin
    kotlin: ['okhttp'],
    // Node.js
    node: ['axios', 'fetch', 'ofetch', 'undici'],
    // Objective-C
    objc: ['nsurlsession'],
    // OCaml
    ocaml: ['cohttp'],
    // PHP
    php: ['curl', 'guzzle'],
    // PowerShell
    powershell: ['restmethod', 'webrequest'],
    // Python
    python: ['httpx_async', 'httpx_sync', 'python3', 'requests'],
    // R
    r: ['httr'],
    // Ruby
    ruby: ['native'],
    // Rust
    rust: ['reqwest'],
    // Shell
    shell: ['curl', 'httpie', 'wget'],
    // Swift
    swift: ['nsurlsession'],
  }
}
```

<!-- AUTO-GENERATED:CLIENTS END -->

But you can also pass `true` to **hide all** HTTP clients. If you have any custom code examples (`x-scalar-examples`) in your API definition, these still render:

```javascript
{
  hiddenClients: true
}
```

---

You can also provide an `object` where each **key** corresponds to a language,
and each **value** specifies the visibility behavior for the clients of that language.

* `true` — hides all clients for the specified language
* `false` — shows all clients for the specified language
* `['client1', 'client2']` — hides only the listed clients for the specified language

```typescript
{
  hiddenClients: {
    c: false,
    js: true,
    shell: ['httpie'], // show all except `httpie`
  },
}
```

#### isLoading

**Type:** `boolean`

Controls whether the references show a loading state in the intro section. Useful when you want to indicate that content is being loaded.

**Default:** `false`

```javascript
{
  isLoading: true
}
```

#### layout

**Type:** `'modern' | 'classic'`

The layout style to use for the API reference.

**Default:** `'modern'`

```javascript
{
  layout: 'modern' // or 'classic'
}
```

#### metaData

**Type:** `object`

You can pass information to the config object to configure meta information out of the box.

```javascript
{
  metaData: {
    title: 'Page title',
    description: 'My page description',
    ogDescription: 'Still about my my page',
    ogTitle: 'Page title',
    ogImage: 'https://example.com/image.png',
    twitterCard: 'summary_large_image',
    // Add more...
  }
}
```

#### operationTitleSource

**Type:** `'summary' | 'path'`

Whether the sidebar display text and search should use the operation summary or the operation path.

**Default:** `'summary'`

```javascript
{
  operationTitleSource: 'path'
}
```

#### orderRequiredPropertiesFirst

**Type:** `boolean`

Whether to order required properties first in schema objects. When enabled, required properties will be displayed before optional properties in model definitions.

**Default:** `true`

```javascript
{
  orderRequiredPropertiesFirst: true
}
```

#### orderSchemaPropertiesBy

**Type:** `'alpha' | 'preserve'`

Control how schema properties are ordered in model definitions. Can be set to:

- `'alpha'`: Sort properties alphabetically by name
- `'preserve'`: Preserve the order from the OpenAPI Document

**Default:** `'alpha'`

```javascript
// Preserve original ordering
{
  orderSchemaPropertiesBy: 'preserve'
}
```

#### pathRouting

**Type:** `{ basePath: string }`

Configuration for path-based routing instead of hash-based routing. Your server must support this routing method.

```javascript
{
  pathRouting: {
    basePath: '/standalone-api-reference'
  }
}
```

#### persistAuth

**Type:** `boolean`

Whether to persist authentication credentials in local storage. This allows the authentication state to be maintained across page reloads.

**Default:** `false`

```javascript
{
  persistAuth: true
}
```

> [!WARNING]
> Persisting authentication information in the browser's local storage may present security risks in certain environments. Use this feature with caution based on your security requirements.

#### telemetry

**Type:** `boolean`

Whether to enable telemetry.

Wait, did I say telemetry? We do track one thing, and only thing, and that’s *whether* a request was sent through the API client. This gives us a tiny, tiny insight into whether people use the API client and confirms whether we’re on the right track building a good experience for everyone. You can search the codebase for `analytics?.capture` to see what we capture, it’s all open-source. :)

To be clear: *We don’t track who sends a request, we don’t track what request was sent and we don't track where a request was sent to.*

Anyway, totally makes sense to disable it in some environments, so feel free to add `telemetry: false`, we will still be thankful you are using Scalar.

**Default:** `true`

```javascript
{
  telemetry: false
}
```

#### plugins

**Type:** `ApiReferencePlugin[]`

Pass an array of custom plugins that you want. [Read more about plugins here.](plugins.md)

```javascript
{
  plugins: [
    XCustomExtensionPlugin(),
  ],
}
```

#### proxyUrl

**Type:** `string`

Making requests to other domains is restricted in the browser and requires [CORS headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS). It's recommended to use a proxy to send requests to other origins.

```javascript
{
  proxyUrl: 'https://proxy.example.com'
}
```

You can use our hosted proxy:

```javascript
{
  proxyUrl: 'https://proxy.scalar.com'
}
```

If you like to run your own, check out our [example proxy written in Go](https://github.com/scalar/scalar/tree/main/projects/proxy-scalar-com).

Please note: You may not use just any reverse proxy, but need to use a proxy that adheres to the Scalar Proxy API. See the example to learn more.

#### searchHotKey

**Type:** `string`

Key used with CTRL/CMD to open the search modal.

**Default:** `'k'` (e.g. CMD+k)

```javascript
{
  searchHotKey: 'l'
}
```

#### servers

**Type:** `Server[]`

Pass a list of servers to override the servers in your OpenAPI document.

```javascript
{
  servers: [
    {
      url: 'https://api.scalar.com',
      description: 'Production',
    },
    {
      url: 'https://sandbox.scalar.com:{port}',
      description: 'Development sandboxes',
      variables: {
        port: {
          default: '8080',
        }
      }
    },
  ]
}
```

#### showSidebar

**Type:** `boolean`

Whether the sidebar should be shown.

**Default:** `true`

```javascript
{
  showSidebar: true
}
```

#### showDeveloperTools

**Type:** `'always' | 'localhost' | 'never'`

Whether and when to show the developer tools. By default only shows on `localhost` (and other domains used for development).

**Default:** `'localhost'`

To disable the toolbar set:

```javascript
{
  showDeveloperTools: 'never'
}
```

#### theme

**Type:** `string`

You don't like the color scheme? We've prepared some themes for you:

Can be one of: **alternate**, **default**, **moon**, **purple**, **solarized**, **bluePlanet**, **saturn**, **kepler**, **mars**, **deepSpace**, **laserwave**, **none**

**Default:** `'default'`

```javascript
{
  theme: 'default'
}
```

#### url

**Type:** `string`

Pass the URL of an OpenAPI document (JSON or YAML).

```javascript
{
  url: '/openapi.json'
}
```

#### withDefaultFonts

**Type:** `boolean`

By default we're using Inter and JetBrains Mono, served from our fonts CDN at `https://fonts.scalar.com`. If you use a different font or just don't want to load web fonts, pass `withDefaultFonts: false` to the configuration.

**Default:** `true`

```javascript
{
  withDefaultFonts: false
}
```

### Methods

Custom functions to control specific behaviors and URL generation.

#### fetch

**Type:** `(input: string | URL | globalThis.Request, init?: RequestInit) => Promise<Response>`

Custom [fetch function](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) to fetch documents with a custom logic. Can be used to add custom headers, handle auth, etc.

```javascript
{
  fetch: (input: string | URL | globalThis.Request, init?: RequestInit) => {
    return window.fetch(input, init)
  }
}
```

#### generateHeadingSlug

**Type:** `(heading: Heading) => string`

Customize how heading URLs are generated. This function receives the heading and returns a string ID that controls the entire URL hash.

> Note: This must be passed through JavaScript, setting a data attribute will not work.

```javascript
// Default behavior - results in hash: #description/heading-slug
{
  generateHeadingSlug: (heading) => `#description/${heading.slug}`
}

// Custom example
{
  generateHeadingSlug: (heading) => `#custom-section/${heading.slug}`
}
```

#### generateModelSlug

**Type:** `(model: { name: string }) => string`

Customize how model URLs are generated. This function receives the model object and returns a string ID. Note that `model/` will automatically be prepended to the result.

> Note: This must be passed through JavaScript, setting a data attribute will not work.

```javascript
// Default behavior - results in hash: #model/model-name
{
  generateModelSlug: (model) => slug(model.name)
}

// Custom example - results in hash: #model/custom-prefix-model-name
{
  generateModelSlug: (model) => `custom-prefix-${model.name.toLowerCase()}`
}
```

#### generateOperationSlug

**Type:** `(operation: Operation) => string`

Customize how operation URLs are generated. This function receives the operation object containing `path`, `operationId`, `method`, and `summary`. Note that `tag/tag-name/` will automatically be prepended to the result.

> Note: This must be passed through JavaScript, setting a data attribute will not work.

```javascript
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

#### generateTagSlug

**Type:** `(tag: Tag) => string`

Customize how tag URLs are generated. This function receives the tag object and returns a string ID. Note that `tag/` will automatically be prepended to the result.

> Note: This must be passed through JavaScript, setting a data attribute will not work.

```javascript
// Default behavior - results in hash: #tag/tag-name
{
  generateTagSlug: (tag) => slug(tag.name)
}

// Custom example - results in hash: #tag/v1-tag-name
{
  generateTagSlug: (tag) => `v1-${tag.name.toLowerCase()}`
}
```

#### generateWebhookSlug

**Type:** `(webhook: { name: string; method?: string }) => string`

Customize how webhook URLs are generated. This function receives the webhook object containing the name and an optional HTTP method. Note that `webhook/` will automatically be prepended to the result.

> Note: This must be passed through JavaScript, setting a data attribute will not work.

```javascript
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

#### tagsSorter

**Type:** `'alpha' | (a: Tag, b: Tag) => number`

Sort tags alphanumerically (`'alpha'`):

```javascript
{
  tagsSorter: 'alpha'
}
```

#### operationsSorter

**Type:** `'alpha' | 'method' | ((a: OperationSortValue, b: OperationSortValue) => number)`

Sort operations alphanumerically (`'alpha'`) or by HTTP method (`'method'`):

**Default:** `'alpha'`

```javascript
{
  operationsSorter: 'alpha'
}
```

Or specify a custom function to sort the operations:

```javascript
{
  operationsSorter: (a, b) => {
    const methodOrder = ['get', 'post', 'put', 'delete']
    const methodComparison = methodOrder.indexOf(a.method) - methodOrder.indexOf(b.method)

    if (methodComparison !== 0) {
      return methodComparison
    }

    return a.path.localeCompare(b.path)
  },
}
```

> Note: `method` is the HTTP method of the operation, represented as a lowercase string.

#### redirect

**Type:** `(path: string) => string | null | undefined`

Function to handle redirects in the API reference. Receives either:
- The current path with hash if pathRouting is enabled
- The current hash if using hashRouting (default)

```javascript
// Example for hashRouting (default)
{
  redirect: (hash) => hash.replace('#v1/old-path', '#v2/new-path')
}

// Example for pathRouting
{
  redirect: (pathWithHash) => {
    if (pathWithHash.includes('#')) {
      return pathWithHash.replace('/v1/tags/user#operation/get-user', '/v1/tags/user/operation/get-user')
    }
    return null
  }
}
```

### Events

Callback functions that are triggered by user interactions and system events.

#### onBeforeRequest

**Type:** `({ request: Request }) => void | Promise<void>`

Callback function that is fired before a request is sent through the API client.

The function receives the request object and can be used to modify the request before it is sent.

```javascript
{
  onBeforeRequest: ({ request }) => {
    // Add a custom header to all requests
    request.headers.set('X-Custom-Header', 'test')
  }
}
```

#### onDocumentSelect

**Type:** `() => Promise<void> | void`

Triggered when multiple documents are configured and the users switches between them.

#### onLoaded

**Type:** `(slug: string) => Promise<void> | void`

Callback that triggers as soon as the references are lazy loaded.

> Note: This must be passed through JavaScript, setting a data attribute will not work.

```javascript
{
  onLoaded: () => {
    console.log('References loaded')
  }
}
```

#### onRequestSent

**Type:** `(request: string) => void`

Callback function that is triggered when a request is sent through the API client. The function receives the request details as a string.

```javascript
{
  onRequestSent: (request) => {
    console.log('Request sent:', request)
  }
}
```

#### onServerChange

**Type:** `(server: string) => void`

You can listen to changes with onServerChange that runs on server change.

```javascript
{
  onServerChange: (value: string) => {
    console.log('Server updated:', value)
  }
}
```

#### onShowMore

**Type:** `(tagId: string) => void | Promise<void>`

Callback function that is triggered when a user clicks the "Show more" button in the references. The function receives the ID of the tag that was clicked.

```javascript
{
  onShowMore: (tagId) => {
    console.log('Show more clicked for tag:', tagId)
  }
}
```

#### onSidebarClick

**Type:** `(href: string) => void | Promise<void>`

Callback function that is triggered when a user clicks on any item in the sidebar. The function receives the href of the clicked item.

```javascript
{
  onSidebarClick: (href) => {
    console.log('Sidebar item clicked:', href)
  }
}
```

#### onSpecUpdate

**Type:** `(spec: string) => void`

You can listen to changes with onSpecUpdate that runs on spec/swagger content change.

```javascript
{
  onSpecUpdate: (value: string) => {
    console.log('Content updated:', value)
  }
}
```
