export type ReferenceProps = {
  documentName?: string
  token?: string
  isEditable: boolean
  showSidebar: boolean
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

export type Tag = {
  name: string
  description: string
  operations: Operation[]
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
