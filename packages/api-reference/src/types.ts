import {
  type OpenAPIV2,
  type OpenAPIV3,
  type OpenAPIV3_1,
} from '@scalar/openapi-parser'
import { type ThemeId } from '@scalar/themes'
import type { MetaFlatInput } from '@unhead/schema'
import type { HarRequest } from 'httpsnippet-lite'
import { type Slot } from 'vue'

export type ReferenceProps = {
  configuration?: ReferenceConfiguration
}

export type ReferenceLayoutProps = {
  configuration: ReferenceConfiguration
  parsedSpec: Spec
  rawSpec: string
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
  /** Whether dark mode is on or off (light mode) */
  darkMode?: boolean
  /** Key used with CNTRL/CMD to open the search modal (defaults to 'k' e.g. CMD+k) */
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
  metaData?: MetaFlatInput
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
}

export type SpecConfiguration = {
  /** URL to a Swagger/OpenAPI file */
  url?: string
  /** Swagger/Open API spec */
  content?: string | Record<string, any> | (() => Record<string, any>)
}

export type GettingStartedExamples = 'Petstore' | 'CoinMarketCap'

export type Schema = {
  type: string
  name?: string
  example?: any
  default?: any
  format?: string
  description?: string
  properties?: Record<string, Schema>
}

export type Parameters = {
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
}

export type Response = {
  description: string
  content: any
}

export type CustomRequestExample = {
  lang: string
  label: string
  source: string
}

export type Information = {
  'description'?: string
  'operationId'?: string | number
  'parameters'?: Parameters[]
  'responses'?: Record<string, Response>
  'security'?: OpenAPIV3.SecurityRequirementObject[]
  'requestBody'?: RequestBody
  'summary'?: string
  'tags'?: string[]
  'deprecated'?: boolean
  /**
   * Scalar
   **/
  'x-custom-examples'?: CustomRequestExample[]
  /**
   * Redocly, current
   **/
  'x-codeSamples'?: CustomRequestExample[]
  /**
   * Redocly, deprecated
   **/
  'x-code-samples'?: CustomRequestExample[]
}

export type Operation = {
  httpVerb: string
  path: string
  operationId?: string
  name?: string
  description?: string
  information?: Information
}

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

export type TransformedOperation = Operation & {
  pathParameters?: Parameters[]
}

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

export type ContentType =
  | 'application/json'
  | 'application/xml'
  | 'text/plain'
  | 'text/html'
  | 'application/octet-stream'
  | 'application/x-www-form-urlencoded'
  | 'multipart/form-data'

export type Content = {
  [key in ContentType]: ContentSchema
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

export type AuthenticationState = {
  securitySchemeKey: string | null
  securitySchemes?:
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
  }
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

export type Header = {
  name: string
  value: string
}

export type Query = {
  name: string
  value: string
}

export type Cookie = {
  name: string
  value: string
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
