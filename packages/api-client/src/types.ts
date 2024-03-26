import type { BaseParameter } from '@scalar/oas-utils'

export type Header = BaseParameter

export type Query = BaseParameter

export type Cookie = BaseParameter

export type FormDataItem = BaseParameter

export type GeneratedParameter = {
  name: string
  value: string
}

/** Complete request state for a client request */
export type ClientRequestConfig = {
  id?: string
  name?: string
  url: string
  /** HTTP Request Method */
  type: string
  /** Request path */
  path: string
  /** Variables */
  variables?: BaseParameter[]
  /** Query parameters */
  query?: Query[]
  /** Cookies */
  cookies?: Cookie[]
  /** Request headers */
  headers?: Header[]
  /** Content type matched body */
  body?: string
  /** Optional form data body */
  formData?: FormDataItem[]
}

/** Formatted request for the proxy server */
export type ProxyPayload = {
  method: string
  url: string
  body: string
  headers: Header[]
  auth: Record<string, string>
  grpc: boolean
}

/** Client response from the proxy */
export type ClientResponse = {
  cookies: Record<string, string>
  headers: Record<string, string>
  statusCode: number
  statusText: string
  data: string
  query: Record<string, any>
  duration: number
}

export type SendRequestConfig = Partial<ClientRequestConfig> &
  Required<Pick<ClientRequestConfig, 'url'>>

export type RequestResult = {
  request: ClientRequestConfig
  response: ClientResponse
  responseId: string
  sentTime: number
}

export type Schema = {
  format: string
  type: string
}

export type Security = {
  api_key?: any[]
  petstore_auth?: string[]
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

export type ContentSchemaSchema = {
  type: string
  required: string[]
  properties: ContentProperties
}

export type ContentSchema = {
  schema: ContentSchemaSchema
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

export type Response = {
  description: string
  content: any
}
