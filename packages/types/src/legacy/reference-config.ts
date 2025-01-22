import type {
  OpenAPI,
  OpenAPIV2,
  OpenAPIV3,
  OpenAPIV3_1,
} from '@scalar/openapi-types'
import type { UseSeoMetaInput } from '@unhead/schema'

import type { HarRequest, TargetId } from '../external/index.ts'

/**
 * This re-export is needed due to a typescript issue
 * @see https://github.com/microsoft/TypeScript/issues/42873
 */
export type {
  OpenAPI,
  OpenAPIV2,
  OpenAPIV3,
  OpenAPIV3_1,
} from '@scalar/openapi-types'

export type ClientInfo = {
  key: string
  title: string
  link: string
  description: string
}

/**
 * Alias for the OpenAPI 3.1 ServerObject type
 *
 * @deprecated Use OpenAPIV3_1.ServerObject instead
 */
export type Server = OpenAPIV3_1.ServerObject

export type TargetInfo = {
  key: TargetId
  title: string
  extname: `.${string}` | null
  default: string
}

export type HiddenClients =
  // Just hide all
  | true
  // Exclude whole targets or just specific clients
  | Partial<Record<TargetInfo['key'], boolean | ClientInfo['key'][]>>
  // Backwards compatibility with the previous behavior ['fetch', 'xhr']
  | ClientInfo['key'][]

type HttpClientState = { targetKey: TargetId; clientKey: string }

export type PathRouting = {
  basePath: string
}

export type ThemeId =
  | 'alternate'
  | 'default'
  | 'moon'
  | 'purple'
  | 'solarized'
  | 'bluePlanet'
  | 'deepSpace'
  | 'saturn'
  | 'kepler'
  | 'elysiajs'
  | 'fastify'
  | 'mars'
  | 'none'

export type ReferenceConfiguration = {
  /** A string to use one of the color presets */
  theme?: ThemeId
  /** The layout to use for the references */
  layout?: 'modern' | 'classic'
  /** The Swagger/OpenAPI spec to render */
  spec?: SpecConfiguration
  /**
   * URL to a request proxy for the API client
   *
   * @deprecated Use proxyUrl instead
   */
  proxy?: string
  /** URL to a request proxy for the API client */
  proxyUrl?: string
  /** Whether the spec input should show */
  isEditable?: boolean
  /** Whether to show the sidebar */
  showSidebar?: boolean
  /**
   * Whether to show models in the sidebar, search, and content.
   *
   * @default false
   */
  hideModels?: boolean
  /**
   * Whether to show the “Download OpenAPI Document” button
   *
   * @default false
   */
  hideDownloadButton?: boolean
  /**
   * Whether to show the “Test Request” button
   *
   * @default: false
   */
  hideTestRequestButton?: boolean
  /**
   * Whether to show the sidebar search bar
   *
   * @default: false
   */
  hideSearch?: boolean
  /** Whether dark mode is on or off initially (light mode) */
  darkMode?: boolean
  /** forceDarkModeState makes it always this state no matter what*/
  forceDarkModeState?: 'dark' | 'light'
  /** Whether to show the dark mode toggle */
  hideDarkModeToggle?: boolean
  /** Key used with CTRL/CMD to open the search modal (defaults to 'k' e.g. CMD+k) */
  searchHotKey?:
    | 'a'
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
    | 'z'
  /**
   * If used, passed data will be added to the HTML header
   * @see https://unhead.unjs.io/usage/composables/use-seo-meta
   */
  metaData?: UseSeoMetaInput
  /**
   * Path to a favicon image
   *
   * @default undefined
   * @example '/favicon.svg'
   */
  favicon?: string
  /**
   * List of httpsnippet clients to hide from the clients menu
   * By default hides Unirest, pass `[]` to show all clients
   */
  hiddenClients?: HiddenClients
  /** Determine the HTTP client that’s selected by default */
  defaultHttpClient?: HttpClientState
  /** Custom CSS to be added to the page */
  customCss?: string
  /** onSpecUpdate is fired on spec/swagger content change */
  onSpecUpdate?: (spec: string) => void
  /** Prefill authentication */
  authentication?: Partial<AuthenticationState>
  /**
   * Route using paths instead of hashes, your server MUST support this
   * for example vue router needs a catch all so any subpaths are included
   *
   * @example
   * '/standalone-api-reference/:custom(.*)?'
   *
   * @experimental
   * @default undefined
   */
  pathRouting?: PathRouting
  /**
   * If you want to customize the heading portion of the hash you can pass in a function that receives the heading
   * and returns a string ID. This will then be used to generate the url hash. You control the whole hash with this
   * function.
   *
   * Note: you must pass this function through js, setting a data attribute will not work!
   *
   * @default
   * (heading: Heading) => `#description/${heading.slug}`
   */
  generateHeadingSlug?: (heading: Heading) => string
  /**
   * If you want to customize the model portion of the hash you can pass in a function that receives the model name
   * and returns a string ID. This will then be used to generate the url hash. model/ will get prepended to the result
   * of this function as seen far below.
   *
   * Note: you must pass this function through js, setting a data attribute will not work!
   *
   * @default
   * (model) => slug(model.name)
   *
   * which would give the full hash of `#model/${slug(model.name)}`
   */
  generateModelSlug?: (model: { name: string }) => string
  /**
   * If you want to customize the tag portion of the hash you can pass in a function that receives the tag
   * and returns a string ID. This will then be used to generate the url hash. tag/ will get prepended to the result
   * of this function as seen far below.
   *
   * Note: you must pass this function through js, setting a data attribute will not work!
   *
   * @default
   * (tag) => slug(tag.name)
   *
   * which would give the full hash of `#tag/tag-name`
   */
  generateTagSlug?: (tag: Tag) => string
  /**
   * If you want to customize the operation portion of the hash you can pass in a function that receives the operation
   * and returns a string ID. This will then be used to generate the url hash. tag/slug(tag.name) will get prepended to
   * the result of this function as seen far below.
   *
   * Note: you must pass this function through js, setting a data attribute will not work!
   *
   * @default
   * (operation) => `${operation.method}${operation.path}`
   *
   * which would give the full hash of `#tag/tag-name/post-path`
   */
  generateOperationSlug?: (operation: {
    path: string
    operationId: string | undefined
    method: string
    summary: string | undefined
  }) => string
  /**
   * If you want to customize the webhook portion of the hash you can pass in a function that receives the webhook name
   * and possibly a HTTP verb and returns a string ID. This will then be used to generate the url hash. webhook/ will get
   * prepended to the result of this function as seen far below.
   *
   * Note: you must pass this function through js, setting a data attribute will not work!
   *
   * @default
   * (webhook) => slug(webhook.name)
   *
   * which would give the full hash of `#webhook/webhook-name`
   */
  generateWebhookSlug?: (webhook: { name: string; method?: string }) => string
  /**
   * The baseServerURL is used when the spec servers are relative paths and we are using SSR.
   * On the client we can grab the window.location.origin but on the server we need
   * to use this prop.
   *
   * @default undefined
   * @example 'http://localhost:3000'
   */
  baseServerURL?: string
  /**
   * List of servers to override the servers in the given OpenAPI document
   *
   * @default undefined
   * @example [{ url: 'https://api.scalar.com', description: 'Production server' }]
   */
  servers?: OpenAPIV3_1.ServerObject[]
  /**
   * We’re using Inter and JetBrains Mono as the default fonts. If you want to use your own fonts, set this to false.
   *
   * @default true
   */
  withDefaultFonts?: boolean
  /**
   * By default we only open the relevant tag based on the url, however if you want all the tags open by default then set this configuration option :)
   *
   * @default false
   */
  defaultOpenAllTags?: boolean
  /**
   * Sort tags alphabetically or with a custom sort function
   */
  tagsSorter?: 'alpha' | ((a: Tag, b: Tag) => number)
  /**
   * Sort operations alphabetically, by method or with a custom sort function
   */
  operationsSorter?:
    | 'alpha'
    | 'method'
    | ((a: TransformedOperation, b: TransformedOperation) => number)
  /**
   * Specifies the integration being used. This is primarily for internal purposes and should not be manually set.
   *
   * It’s used to:
   * 1. Display debug information in the console.
   * 2. Show a custom logo when importing OpenAPI documents in the Scalar App.
   *
   * Each supported integration has a unique identifier (e.g., 'express', 'nextjs', 'vue').
   *
   * To explicitly disable this feature, you can pass `null`.
   *
   * @private
   */
  _integration?:
    | null
    | 'adonisjs'
    | 'docusaurus' // ✅
    | 'dotnet'
    | 'elysiajs'
    | 'express' // ✅
    | 'fastapi' // ✅
    | 'fastify' // ✅
    | 'go'
    | 'hono' // ✅
    | 'html' // ✅
    | 'laravel'
    | 'litestar'
    | 'nestjs' // ✅
    | 'nextjs' // ✅
    | 'nitro'
    | 'nuxt' // ✅
    | 'platformatic'
    | 'react' // ✅
    | 'rust'
    | 'vue' // ✅
  /**
   * Whether to show the client button from the reference sidebar and modal
   *
   * @default false
   */
  hideClientButton?: boolean
}

export type BaseParameter = {
  name: string
  description?: string | null
  value: string | number | Record<string, any>
  required?: boolean
  enabled: boolean
}

type OptionalCharset = string | null

export type ContentType =
  | `application/json${OptionalCharset}`
  | `application/xml${OptionalCharset}`
  | `text/plain${OptionalCharset}`
  | `text/html${OptionalCharset}`
  | `application/octet-stream${OptionalCharset}`
  | `application/x-www-form-urlencoded${OptionalCharset}`
  | `multipart/form-data${OptionalCharset}`

export type Cookie = {
  name: string
  value: string
}

export type CustomRequestExample = {
  lang: string
  label: string
  source: string
}

export type HarRequestWithPath = HarRequest & {
  path: string
}

export type Header = {
  name: string
  value: string
}

export enum XScalarStability {
  Deprecated = 'deprecated',
  Experimental = 'experimental',
  Stable = 'stable',
}

export type Information = {
  'description'?: string
  'operationId'?: string | number
  'parameters'?: Parameters[]
  'responses'?: Record<string, OpenAPI.ResponseObject>
  'security'?: OpenAPIV3.SecurityRequirementObject[]
  'requestBody'?: RequestBody
  'summary'?: string
  'tags'?: string[]
  'deprecated'?: boolean
  'servers'?: OpenAPIV3_1.ServerObject[]
  /**
   * Scalar
   */
  'x-custom-examples'?: CustomRequestExample[]
  'x-scalar-stability'?: XScalarStability
  /**
   * Redocly, current
   */
  'x-codeSamples'?: CustomRequestExample[]
  /**
   * Redocly, deprecated
   */
  'x-code-samples'?: CustomRequestExample[]
}

export type Operation = {
  httpVerb:
    | 'GET'
    | 'HEAD'
    | 'PATCH'
    | 'POST'
    | 'PUT'
    | 'TRACE'
    | 'CONNECT'
    | 'DELETE'
    | 'OPTIONS'
  path: string
  operationId?: string
  name?: string
  description?: string
  information?: Information
  servers?: OpenAPIV3_1.ServerObject[]
}

/**
 * @deprecated Use Parameter instead
 */
export type Parameters = Parameter

export type Parameter = {
  // Fixed Fields
  name: string
  in?: string
  description?: string
  required?: boolean
  deprecated?: boolean
  allowEmptyValue?: boolean
  // Other
  style?: 'form' | 'simple'
  explode?: boolean
  allowReserved?: boolean
  schema?: Schema
  example?: any
  examples?: Map<string, any>
  content?: RequestBodyMimeTypes
  headers?: { [key: string]: OpenAPI.HeaderObject }
}

export type Query = {
  name: string
  value: string
}

// Create a mapped type to ensure keys are a subset of ContentType
export type RequestBodyMimeTypes = {
  [K in ContentType]?: {
    schema?: any
    example?: any
    examples?: any
  }
}

export type RequestBody = {
  description?: string
  required?: boolean
  content?: RequestBodyMimeTypes
}

/** The OpenAPI Document we’ll render */
export type SpecConfiguration = {
  /**
   * URL to an OpenAPI/Swagger document
   */
  url?: string
  /**
   * Directly embed the OpenAPI document in the HTML.
   *
   * @remark It’s recommended to pass an `url` instead of `content`.
   */
  content?: string | Record<string, any> | (() => Record<string, any>) | null
}

export type Schema = {
  type: string
  name?: string
  example?: any
  default?: any
  format?: string
  description?: string
  properties?: Record<string, Schema>
}

/**
 * This is a very strange and custom way to represent the operation object.
 * It’s the outcome of the `parse` helper.
 *
 * @deprecated This is evil. Stop using it. We’ll transition to use the new store.
 */
export type TransformedOperation = Operation & {
  pathParameters?: Parameter[]
}

export type CollapsedSidebarItems = Record<string, boolean>

export type AuthenticationState = {
  customSecurity: boolean
  preferredSecurityScheme: string | null
  securitySchemes?:
    | OpenAPIV2.SecurityDefinitionsObject
    | OpenAPIV3.ComponentsObject['securitySchemes']
    | OpenAPIV3_1.ComponentsObject['securitySchemes']
  http: {
    basic: {
      username: string
      password: string
    }
    bearer: {
      token: string
    }
  }
  apiKey: {
    token: string
  }
  oAuth2: {
    clientId: string
    scopes: string[]
    accessToken: string
    state: string
    username: string
    password: string
  }
}

export type Heading = {
  depth: number
  value: string
  slug?: string
}

export type CodeBlockSSRKey = `components-scalar-code-block${number}`
export type DescriptionSectionSSRKey =
  `components-Content-Introduction-Description-sections${number}`
export type ExampleRequestSSRKey =
  `components-Content-Operation-Example-Request${number}`

export type ScalarState = {
  'hash'?: string
  'useGlobalStore-authentication'?: AuthenticationState
  'useSidebarContent-collapsedSidebarItems'?: CollapsedSidebarItems
  [key: CodeBlockSSRKey]: string
  [key: DescriptionSectionSSRKey]: {
    heading: Heading
    content: string
  }[]
  [key: ExampleRequestSSRKey]: string
}

export type SSRState = {
  payload: {
    data: ScalarState
  }
  url: string
}

export type Tag = {
  'name': string
  'description': string
  'operations': TransformedOperation[]
  'x-displayName'?: string
}

export type TagGroup = {
  name: string
  tags: string[]
}

export type Definitions = OpenAPIV2.DefinitionsObject

/**
 * Webhook (after our super custom transformation process)
 *
 * @deprecated Let’s get rid of those super custom transformed entities and use the store instead.
 */
export type Webhooks = Record<
  string,
  Record<
    OpenAPIV3_1.HttpMethods,
    TransformedOperation & {
      'x-internal'?: boolean
    }
  >
>

/**
 * The native OpenAPI Webhook object, but with the x-internal and x-scalar-ignore properties
 */
export type Webhook = (
  | OpenAPIV3.OperationObject
  | OpenAPIV3_1.OperationObject
) & {
  'x-internal'?: boolean
  'x-scalar-ignore'?: boolean
}

export type Spec = {
  'tags'?: Tag[]
  'info':
    | Partial<OpenAPIV2.Document['info']>
    | Partial<OpenAPIV3.Document['info']>
    | Partial<OpenAPIV3_1.Document['info']>
  'host'?: OpenAPIV2.Document['host']
  'basePath'?: OpenAPIV2.Document['basePath']
  'schemes'?: OpenAPIV2.Document['schemes']
  'externalDocs'?: {
    url: string
    description?: string
  }
  'servers'?: OpenAPIV3.Document['servers'] | OpenAPIV3_1.Document['servers']
  'components'?: OpenAPIV3.ComponentsObject | OpenAPIV3_1.ComponentsObject
  'webhooks'?: Webhooks
  'definitions'?: Definitions
  'swagger'?: OpenAPIV2.Document['swagger']
  'openapi'?: OpenAPIV3.Document['openapi'] | OpenAPIV3_1.Document['openapi']
  'x-tagGroups'?: TagGroup[]
  'security'?: OpenAPIV3.SecurityRequirementObject[]
}
