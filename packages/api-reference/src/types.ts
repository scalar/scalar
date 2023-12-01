import { type EditorHeaderTabs } from '@scalar/swagger-editor'
import { type ThemeId } from '@scalar/themes'
import type { MetaFlatInput } from '@unhead/schema'
import type { HarRequest } from 'httpsnippet-lite'
import { type OpenAPIV2, type OpenAPIV3, type OpenAPIV3_1 } from 'openapi-types'
import { type DeepReadonly, type Slot } from 'vue'

export type ReferenceProps = {
  configuration?: ReferenceConfiguration
}

export type SpecConfiguration = {
  /** URL to a Swagger/OpenAPI file */
  url?: string
  /** Swagger/Open API spec */
  content?: string | Record<string, any> | (() => Record<string, any>)
  /** The result of @scalar/swagger-parser */
  preparsedContent?: Record<any, any>
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
  /** The tabs (only visible when isEditable: true) */
  tabs?: {
    /** Disabled tabs completely */
    // enabled?: boolean
    /** The initial tab to show */
    initialContent?: EditorHeaderTabs
    available?: EditorHeaderTabs[]
  }
  /** Whether to show the sidebar */
  showSidebar?: boolean
  /** Remove the Scalar branding :( */
  // doNotPromoteScalar?: boolean
  /** Key used with CNTRL/CMD to open the search modal (defaults to 'k' e.g. CMD+k) */
  searchHotKey?: string
  /** ??? */
  aiWriterMarkdown?: string
  /** If used, passed data will be added to the HTML header. Read more: https://unhead.unjs.io/usage/composables/use-seo-meta */
  metaData?: MetaFlatInput
  /** Custom CSS to be added to the page */
  customCss?: string
}

/** Default reference configuration */
export const DEFAULT_CONFIG: DeepReadonly<ReferenceConfiguration> = {
  spec: {
    content: undefined,
    url: undefined,
    preparsedContent: undefined,
  },
  proxy: undefined,
  theme: 'default',
  tabs: {
    initialContent: 'Getting Started',
  },
  showSidebar: true,
  isEditable: false,
}

export type Schema = {
  format: string
  type: string
  default?: any
}

export type Parameters = {
  description?: string
  in?: string
  name: string
  required?: boolean
  schema?: Schema
}

export type Response = {
  description: string
  content: any
}

export type Information = {
  description?: string
  operationId?: string | number
  parameters?: Parameters[]
  responses?: Record<string, Response>
  security?: OpenAPIV3.SecurityRequirementObject[]
  requestBody?: RequestBody
  summary?: string
  tags?: string[]
}

export type Operation = {
  httpVerb: string
  path: string
  operationId: string
  name: string
  description: string
  information: Information
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

export type RequestBodyMimeTypes =
  | 'application/json'
  | 'application/octet-stream'
  | 'application/x-www-form-urlencoded'
  | 'application/xml'
  | 'multipart/form-data'
  | 'text/plain'

export type TransformedOperation = Operation & {
  pathParameters?: Parameters[]
  information: {
    requestBody?: {
      content?: Record<
        RequestBodyMimeTypes,
        {
          schema?: any
          example?: any
          examples?: any
        }
      >
    }
  }
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
    format: string
    example: string
    required: string[]
    enum?: string[]
    description?: string
    properties?: ContentProperties
  }
}

export type ContentSchema = {
  schema: {
    type: string
    required: string[]
    properties: ContentProperties
  }
}

export type ContentType =
  | 'application/json'
  | 'application/xml'
  | 'text/plain'
  | 'text/html'
  | 'application/x-www-form-urlencoded'
  | 'multipart/form-data'

export type Content = {
  [key in ContentType]: ContentSchema
}

export type RequestBody = {
  description: string
  content: Content
  required: boolean
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

export type Components = Omit<
  OpenAPIV3.ComponentsObject | OpenAPIV3_1.ComponentsObject,
  'securitySchemes'
> & {
  securitySchemes?: Record<
    string,
    | Record<string, never>
    | OpenAPIV3.SecuritySchemeObject
    | OpenAPIV2.SecuritySchemeObject
  >
}

export type Definitions = OpenAPIV2.DefinitionsObject

export type Spec = {
  tags?: Tag[]
  info: Info
  host?: string
  schemes?: string[]
  externalDocs?: ExternalDocs
  servers?: Server[]
  components?: Components
  definitions?: Definitions
  openapi?: string
  swagger?: string
}

export type AuthenticationState = {
  securitySchemeKey: string | null
  securitySchemes?:
    | Record<string, OpenAPIV2.SecuritySchemeObject>
    | Record<string, OpenAPIV3.SecuritySchemeObject>
    | Record<string, OpenAPIV3_1.SecuritySchemeObject>
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
