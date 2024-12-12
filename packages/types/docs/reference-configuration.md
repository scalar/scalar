# Configuration

There’s a universal configuration object that can be used on all platforms.

## ReferenceConfiguration

### authentication?

**Type:**

```typescript
{
    customSecurity?: boolean;
    preferredSecurityScheme?: string;
    securitySchemes?: SecurityDefinitionsObject | {
        [key: string]: ReferenceObject | SecuritySchemeObject;
    } | Record<string, ReferenceObject | SecuritySchemeObject>;
    http?: {
        basic: {
            username: string;
            password: string;
        };
        bearer: {
            token: string;
        };
    };
    apiKey?: {
        token: string;
    };
    oAuth2?: {
        clientId: string;
        scopes: string[];
        accessToken: string;
        state: string;
        username: string;
        password: string;
    };
}
```

Prefill authentication

### baseServerURL?: string

The baseServerURL is used when the spec servers are relative paths and we are using SSR.
On the client we can grab the window.location.origin but on the server we need
to use this prop.

**Default:** `undefined`

### customCss?: string

Custom CSS to be added to the page

### darkMode?: boolean

Whether dark mode is on or off initially (light mode)

### defaultHttpClient?

**Type:**

```typescript
{
  targetKey: TargetId
  clientKey: string
}
```

Determine the HTTP client that’s selected by default

### defaultOpenAllTags?: boolean

By default we only open the relevant tag based on the url, however if you want all the tags open by default then set this configuration option :)

**Default:** `false`

### favicon?: string

Path to a favicon image

**Default:** `undefined`

### forceDarkModeState?

forceDarkModeState makes it always this state no matter what

**Values:**

- `'dark'`
- `'light'`

### hiddenClients?: true | Partial<Record<TargetId, boolean | string[]>> | string[]

List of httpsnippet clients to hide from the clients menu
By default hides Unirest, pass `[]` to show all clients

### hideClientButton?: boolean

Whether to show the client button from the reference sidebar and modal

**Default:** `false`

### hideDarkModeToggle?: boolean

Whether to show the dark mode toggle

### hideDownloadButton?: boolean

Whether to show the “Download OpenAPI Document” button

**Default:** `false`

### hideModels?: boolean

Whether to show models in the sidebar, search, and content.

**Default:** `false`

### hideSearch?: boolean

Whether to show the sidebar search bar

**Default:** `: false`

### hideTestRequestButton?: boolean

Whether to show the “Test Request” button

**Default:** `: false`

### isEditable?: boolean

Whether the spec input should show

### layout?

The layout to use for the references

**Default:** `'modern'`

**Values:**

- `'modern'`
- `'classic'`

### metaData?

**Type:**

```typescript
Partial<MetaFlatNullable> & {
    title?: Title;
    titleTemplate?: TitleTemplate;
}
```

If used, passed data will be added to the HTML header

### onSpecUpdate?: (spec: string) => void

onSpecUpdate is fired on spec/swagger content change

### operationsSorter?

Sort operations alphabetically, by method or with a custom sort function

**Values:**

- `'alpha'`
- `'method'`
- `((a: TransformedOperation, b: TransformedOperation) => number)`

### pathRouting?

**Type:**

```typescript
{
  basePath: string
}
```

Route using paths instead of hashes, your server MUST support this
for example vue router needs a catch all so any subpaths are included

    '/standalone-api-reference/:custom(.)?'

**Default:** `undefined`

### ~~proxy?: string~~

**Deprecated:** Use proxyUrl instead

URL to a request proxy for the API client

### proxyUrl?: string

URL to a request proxy for the API client

### searchHotKey?

Key used with CTRL/CMD to open the search modal (defaults to 'k' e.g. CMD+k)

**Values:**

- `'a'`
- `'b'`
- `'c'`
- `'d'`
- `'e'`
- `'f'`
- `'g'`
- `'h'`
- `'i'`
- `'j'`
- `'k'`
- `'l'`
- `'m'`
- `'n'`
- `'o'`
- `'p'`
- `'q'`
- `'r'`
- `'s'`
- `'t'`
- `'u'`
- `'v'`
- `'w'`
- `'x'`
- `'y'`
- `'z'`

### servers?: Server[]

List of servers to override the openapi spec servers

**Default:** `undefined`

### showSidebar?: boolean

Whether to show the sidebar

### spec?

**Type:**

```typescript
{
    url?: string;
    content?: string | Record<string, any> | (() => Record<string, any>);
}
```

The Swagger/OpenAPI spec to render

### tagsSorter?

Sort tags alphabetically or with a custom sort function

**Values:**

- `'alpha'`
- `((a: Tag, b: Tag) => number)`

### theme?: "alternate" | "default" | "moon" | "purple" | "solarized" | "bluePlanet" | "deepSpace" | "saturn" | "kepler" | "elysiajs" | "fastify" | "mars" | "none"

A string to use one of the color presets

### withDefaultFonts?: boolean

We’re using Inter and JetBrains Mono as the default fonts. If you want to use your own fonts, set this to false.

**Default:** `true`
