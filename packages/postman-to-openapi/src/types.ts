export type PostmanVariable = {
  key: string
  value: string
}

export type PostmanUrl = {
  raw: string
  protocol?: string
  host?: string[]
  path?: string[]
  query?: any[]
  variable?: PostmanVariable[]
}

export type OpenApiDocument = {
  openapi: string
  info: any
  servers?: any[]
  paths: Record<string, any>
  components?: any
  security?: any[]
  tags?: any[]
  externalDocs?: any
}

export type Options = {
  info?: any
  defaultTag?: string
  pathDepth?: number
  auth?: any
  servers?: any[]
  externalDocs?: any
  folders?: any
  responseHeaders?: boolean
  replaceVars?: boolean
  additionalVars?: Record<string, any>
  outputFormat?: 'json'
  disabledParams?: { includeQuery?: boolean; includeHeader?: boolean }
  operationId?: 'off' | 'auto' | 'brackets'
}
export type SecurityDefinition = {
  type: string
  scheme: string
  [key: string]: any
}
