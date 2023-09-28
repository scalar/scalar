import { type HocuspocusConfigurationProp } from '@scalar/swagger-editor'
import { type ThemeId } from '@scalar/themes'

export type ReferenceProps = {
  isEditable?: boolean
  showSidebar?: boolean
  footerBelowSidebar?: boolean
  spec?: string
  specUrl?: string
  specResult?: Record<any, any>
  proxyUrl?: string
  hocuspocusConfiguration?: HocuspocusConfigurationProp
  theme?: ThemeId
}

export type Security = {
  api_key?: any[]
  petstore_auth?: string[]
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
  security: Security[]
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
}

export type Spec = {
  tags: Tag[]
  info: Info
  externalDocs: ExternalDocs
  servers: Server[]
}
