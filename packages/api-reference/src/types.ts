import type {
  AuthenticationState,
  ContentType,
  TransformedOperation,
} from '@scalar/oas-utils'
import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-parser'
import type { ThemeId } from '@scalar/themes'
import type { UseSeoMetaInput } from '@unhead/schema'
import type { HarRequest } from 'httpsnippet-lite'
import type { Slot } from 'vue'

export type ReferenceProps = {
  configuration?: ReferenceConfiguration
}

export type ReferenceLayoutProps = {
  configuration: ReferenceConfiguration
  parsedSpec: Spec
  rawSpec: string
  isDark: boolean
}

export type ReferenceConfiguration = {
  /** A string to use one of the color presets */
  theme?: ThemeId
  /** The layout to use for the references */
  layout?: ReferenceLayoutType
  /** The Swagger/OpenAPI spec to render */
  spec?: SpecConfiguration
  /** URL to a request proxy for the API client */
  proxy?: string
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
   * Whether to show the "Download OpenAPI Specification" button
   *
   * @default false
   */
  hideDownloadButton?: boolean
  /** Whether dark mode is on or off initially (light mode) */
  darkMode?: boolean
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
   * */
  metaData?: UseSeoMetaInput
  /**
   * List of httpsnippet clients to hide from the clients menu
   * By default hides Unirest, pass `[]` to show all clients
   * @see https://github.com/Kong/httpsnippet/wiki/Targets
   */
  hiddenClients?: string[]
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
   * The baseServerURL is used when the spec servers are relative paths and we are using SSR.
   * On the client we can grab the window.location.origin but on the server we need
   * to use this prop.
   *
   * @default undefined
   * @example 'http://localhost:3000'
   */
  baseServerURL?: string
  /**
   * We’re using Inter and JetBrains Mono as the default fonts. If you want to use your own fonts, set this to false.
   *
   * @default true
   */
  withDefaultFonts?: boolean
}

export type PathRouting = {
  basePath: string
}

export type SpecConfiguration = {
  /** URL to a Swagger/OpenAPI file */
  url?: string
  /** Swagger/Open API spec */
  content?: string | Record<string, any> | (() => Record<string, any>)
}

export type GettingStartedExamples = 'Petstore' | 'CoinMarketCap'

export type ExampleResponseHeaders = Record<
  string,
  {
    description: string
    schema: {
      type: string
      format?: string
      example?: string
    }
  }
>

export type Tag = {
  name: string
  description: string
  operations: TransformedOperation[]
}
export type Parameter = {
  name: string
  required: boolean
  displayType: string
  description: string
}

export type ContentProperties = {
  [key: string]: {
    type: string
    format?: string
    example?: any
    required?: string[]
    enum?: string[]
    description?: string
    properties?: ContentProperties
  }
}

export type ContentSchema = {
  schema?: {
    type: string
    required?: string[]
    properties: ContentProperties
  }
}

export type Content = {
  [key in ContentType]: ContentSchema
}

export type Contact = {
  email: string
}

export type License = {
  name: string
  url: string
}

export type Info = {
  title: string
  description?: string
  termsOfService?: string
  contact?: Contact
  license?: License
  version?: string
}

export type ExternalDocs = {
  description: string
  url: string
}

export type ServerVariables = Record<
  string,
  {
    default?: string | number
    description?: string
    enum?: (string | number)[]
  }
>

export type Server = {
  url: string
  description?: string
  variables?: ServerVariables
}

export type TagGroup = {
  name: string
  tags: string[]
}

export type SecurityScheme =
  | Record<string, never> // Empty objects
  | OpenAPIV2.SecuritySchemeObject
  | OpenAPIV3.SecuritySchemeObject
  | OpenAPIV3_1.SecuritySchemeObject

export type Definitions = OpenAPIV2.DefinitionsObject

export type Webhooks = Record<
  string,
  Record<OpenAPIV3_1.HttpMethods, TransformedOperation>
>

export type Spec = {
  'tags'?: Tag[]
  'info':
    | Partial<OpenAPIV2.Document['info']>
    | Partial<OpenAPIV3.Document['info']>
    | Partial<OpenAPIV3_1.Document['info']>
  'host'?: OpenAPIV2.Document['host']
  'basePath'?: OpenAPIV2.Document['basePath']
  'schemes'?: OpenAPIV2.Document['schemes']
  'externalDocs'?: ExternalDocs
  'servers'?: Server[]
  'components'?: OpenAPIV3.ComponentsObject | OpenAPIV3_1.ComponentsObject
  'webhooks'?: Webhooks
  'definitions'?: Definitions
  'swagger'?: OpenAPIV2.Document['swagger']
  'openapi'?: OpenAPIV3.Document['openapi'] | OpenAPIV3_1.Document['openapi']
  'x-tagGroups'?: TagGroup[]
  'security'?: OpenAPIV3.SecurityRequirementObject[]
}

export type Variable = {
  [key: string]: string
}

export type ServerState = {
  selectedServer: null | number
  description?: string
  servers: Server[]
  variables: Variable[]
}

export type HarRequestWithPath = HarRequest & {
  path: string
}

export type ReferenceLayoutType = 'modern' | 'classic'

/** Slots required for standalone reference components */
export type ReferenceSlot = 'footer'

export type ReferenceSlots = {
  // None of our slots should have any slot props
  [x in ReferenceSlot]: Slot<Record<string, never>>
}

/** Slots required for reference base / layout component */
export type ReferenceLayoutSlot =
  | 'header'
  | 'footer'
  | 'editor'
  | 'content-start'
  | 'content-end'
  | 'sidebar-start'
  | 'sidebar-end'

export type ReferenceSlotProps = {
  spec: Spec
  breadcrumb: string
}
