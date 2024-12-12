# ReferenceConfiguration

## theme?

**Type:** `ThemeId`

A string to use one of the color presets

## layout?

**Type:** `'modern' | 'classic'`

The layout to use for the references

**Default:** 'modern'

## spec?

**Type:** `SpecConfiguration`

The Swagger/OpenAPI spec to render

## ~~proxy?~~

**Deprecated:** Use proxyUrl instead

**Type:** `string`

URL to a request proxy for the API client

## proxyUrl?

**Type:** `string`

URL to a request proxy for the API client

## isEditable?

**Type:** `boolean`

Whether the spec input should show

## showSidebar?

**Type:** `boolean`

Whether to show the sidebar

## hideModels?

**Type:** `boolean`

Whether to show models in the sidebar, search, and content.

**Default:** false

## hideDownloadButton?

**Type:** `boolean`

Whether to show the “Download OpenAPI Document” button

**Default:** false

## hideTestRequestButton?

**Type:** `boolean`

Whether to show the “Test Request” button

**Default:** : false

## hideSearch?

**Type:** `boolean`

Whether to show the sidebar search bar

**Default:** : false

## darkMode?

**Type:** `boolean`

Whether dark mode is on or off initially (light mode)

## forceDarkModeState?

**Type:** `'dark' | 'light'`

forceDarkModeState makes it always this state no matter what

## hideDarkModeToggle?

**Type:** `boolean`

Whether to show the dark mode toggle

## searchHotKey?

**Type:** `| 'a'
    | 'b'
    | 'c'
    | 'd'
    | 'e'
    | 'f'
    | 'g'
    | 'h'
    | 'i'
    | 'j'
    | 'k'
    | 'l'
    | 'm'
    | 'n'
    | 'o'
    | 'p'
    | 'q'
    | 'r'
    | 's'
    | 't'
    | 'u'
    | 'v'
    | 'w'
    | 'x'
    | 'y'
    | 'z'`

Key used with CTRL/CMD to open the search modal (defaults to 'k' e.g. CMD+k)

## metaData?

**Type:** `UseSeoMetaInput`

If used, passed data will be added to the HTML header

## favicon?

**Type:** `string`

Path to a favicon image

**Default:** undefined

## hiddenClients?

**Type:** `HiddenClients`

List of httpsnippet clients to hide from the clients menu
By default hides Unirest, pass `[]` to show all clients

## defaultHttpClient?

**Type:** `HttpClientState`

Determine the HTTP client that’s selected by default

## customCss?

**Type:** `string`

Custom CSS to be added to the page

## onSpecUpdate?

**Type:** `(spec: string) => void`

onSpecUpdate is fired on spec/swagger content change

## authentication?

**Type:** `Partial<AuthenticationState>`

Prefill authentication

## pathRouting?

**Type:** `PathRouting`

Route using paths instead of hashes, your server MUST support this
for example vue router needs a catch all so any subpaths are included

    '/standalone-api-reference/:custom(.)?'

**Default:** undefined

## baseServerURL?

**Type:** `string`

The baseServerURL is used when the spec servers are relative paths and we are using SSR.
On the client we can grab the window.location.origin but on the server we need
to use this prop.

**Default:** undefined

## servers?

**Type:** `Server[]`

List of servers to override the openapi spec servers

**Default:** undefined

## withDefaultFonts?

**Type:** `boolean`

We’re using Inter and JetBrains Mono as the default fonts. If you want to use your own fonts, set this to false.

**Default:** true

## defaultOpenAllTags?

**Type:** `boolean`

By default we only open the relevant tag based on the url, however if you want all the tags open by default then set this configuration option :)

**Default:** false

## tagsSorter?

**Type:** `'alpha' | ((a: Tag, b: Tag) => number)`

Sort tags alphabetically or with a custom sort function

## operationsSorter?

**Type:** `| 'alpha'
    | 'method'
    | ((a: TransformedOperation, b: TransformedOperation) => number)`

Sort operations alphabetically, by method or with a custom sort function

## hideClientButton?

**Type:** `boolean`

Whether to show the client button from the reference sidebar and modal

**Default:** false
