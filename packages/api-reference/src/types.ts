import {
  type EditorHeaderTabs,
  type HocuspocusConfigurationProp,
} from '@scalar/swagger-editor'
import { type ThemeId } from '@scalar/themes'
import { type OpenAPIV2, type OpenAPIV3, type OpenAPIV3_1 } from 'openapi-types'

export type ReferenceProps = {
  configuration?: ReferenceConfiguration
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
  isEditable?: boolean
  /** @deprecated Use the `configuration` prop instead. */
  hocuspocusConfiguration?: HocuspocusConfigurationProp
}

export type ReferenceConfiguration = {
  /** A string to use one of the color presets */
  theme?: ThemeId
  /** The Swagger/OpenAPI spec to render */
  spec?: {
    /** URL to a Swagger/OpenAPI file */
    url?: string
    /** Swagger/Open API spec */
    content?: string | Record<string, any> | (() => Record<string, any>)
    /** The result of @scalar/swagger-parser */
    preparsedContent?: Record<any, any>
  }
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

export type Server = {
  url: string
  description?: string
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
}

export type AuthenticationState = {
  securitySchemeKey: string | null
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
