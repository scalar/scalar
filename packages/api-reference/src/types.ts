import {
  type EditorHeaderTabs,
  type HocuspocusConfigurationProp,
} from '@scalar/swagger-editor'
import { type ThemeId } from '@scalar/themes'
import type { HarRequest } from 'httpsnippet-lite'
import { type OpenAPIV2, type OpenAPIV3, type OpenAPIV3_1 } from 'openapi-types'

export type ReferenceProps = {
  configuration?: ReferenceConfiguration
  aiWriterMarkdown?: string
} & {
  /** @deprecated Use the `configuration` prop instead. */
  spec?: string
  /** @deprecated Use the `configuration` prop instead. */
  specUrl?: string
  /** @deprecated Use the `configuration` prop instead. */
  specResult?: Record<any, any>
  /** @deprecated Use the `configuration` prop instead. */
  proxyUrl?: string
  /** @deprecated Use the `configuration` prop instead. */
  theme?: ThemeId
  /** @deprecated Use the `configuration` prop instead. */
  initialTabState?: EditorHeaderTabs
  /** @deprecated Use the `configuration` prop instead. */
  showSidebar?: boolean
  /** @deprecated Use the `configuration` prop instead. */
  footerBelowSidebar?: boolean
  /** @deprecated Use the `configuration` prop instead. */
  isEditable?: boolean
  /** @deprecated Use the `configuration` prop instead. */
  hocuspocusConfiguration?: HocuspocusConfigurationProp
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
  }
  /** Whether to show the sidebar */
  showSidebar?: boolean
  /** Whether to make the footer full-width (include below the sidebar) */
  footerBelowSidebar?: boolean
  /** Remove the Scalar branding :( */
  // doNotPromoteScalar?: boolean
  hocuspocusConfiguration?: HocuspocusConfigurationProp
  /** Key used with CNTRL/CMD to open the search modal (defaults to 'k' e.g. CMD+k) */
  searchHotKey?: string
}

export type Schema = {
  format: string
  type: string
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
  description: string
  operationId: string
  parameters: Parameters[]
  responses: Record<string, Response>
  security: OpenAPIV3.SecurityRequirementObject[]
  requestBody: RequestBody
  summary: string
  tags: string[]
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

export type TransformedOperation = Operation & {
  responses: Record<
    string,
    Response & {
      headers: ExampleResponseHeaders
    }
  >
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
  description: string
  termsOfService: string
  contact: Contact
  license: License
  version: string
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

export type Components =
  | OpenAPIV3.ComponentsObject
  | OpenAPIV3_1.ComponentsObject

export type Definitions = OpenAPIV2.DefinitionsObject

export type Spec = {
  tags: Tag[]
  info: Info
  externalDocs: ExternalDocs
  servers: Server[]
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
