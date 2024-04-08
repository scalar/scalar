import {
  type OpenAPIV2,
  type OpenAPIV3,
  type OpenAPIV3_1,
} from '@scalar/openapi-parser'
import type { HarRequest } from 'httpsnippet-lite'

export type AnyObject = Record<string, any>

export type AnyStringOrObject = string | Record<string, any>

export type BaseParameter = {
  name: string
  description?: string | null
  value: string | number | Record<string, any>
  required?: boolean
  enabled: boolean
}

export type ContentType =
  | 'application/json'
  | 'application/xml'
  | 'text/plain'
  | 'text/html'
  | 'application/octet-stream'
  | 'application/x-www-form-urlencoded'
  | 'multipart/form-data'

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

export type Information = {
  'description'?: string
  'operationId'?: string | number
  'parameters'?: Parameters[]
  'responses'?: Record<string, ScalarResponse>
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
  httpVerb: string // TODO: set this to RequestMethod?
  path: string
  operationId?: string
  name?: string
  description?: string
  information?: Information
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

export type ScalarResponse = {
  description: string
  content: any
}

export type RequestBody = {
  description?: string
  required?: boolean
  content?: RequestBodyMimeTypes
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

export type TransformedOperation = Operation & {
  pathParameters?: Parameters[]
}

export type DeepPartial<T> =
  T extends Array<infer InferredArrayMemeber>
    ? DeepPartialArray<InferredArrayMemeber>
    : T extends object
      ? DeepPartialObject<T>
      : T | undefined

type DeepPartialArray<T> = T & Array<DeepPartial<T>>

type DeepPartialObject<T> = {
  [Key in keyof T]?: DeepPartial<T[Key]>
}

export type Spec = {
  'tags'?: Tag[]
  'info':
    | DeepPartial<OpenAPIV2.Document['info']>
    | DeepPartial<OpenAPIV3.Document['info']>
    | DeepPartial<OpenAPIV3_1.Document['info']>
  'host'?: OpenAPIV2.Document['host']
  'basePath'?: OpenAPIV2.Document['basePath']
  'schemes'?: OpenAPIV2.Document['schemes']
  'externalDocs'?: Partial<ExternalDocs>
  'servers'?: Server[]
  'components'?: OpenAPIV3.ComponentsObject | OpenAPIV3_1.ComponentsObject
  'webhooks'?: Webhooks
  'definitions'?: Definitions
  'swagger'?: OpenAPIV2.Document['swagger']
  'openapi'?: OpenAPIV3.Document['openapi'] | OpenAPIV3_1.Document['openapi']
  'x-tagGroups'?: TagGroup[]
  'security'?: OpenAPIV3.SecurityRequirementObject[]
}

export type Definitions = OpenAPIV2.DefinitionsObject

export type Tag = {
  name: string
  description: string
  externalDocs?: ExternalDocs
  operations: TransformedOperation[]
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

export type Webhooks = Record<
  string,
  Record<OpenAPIV3_1.HttpMethods, TransformedOperation>
>

export const validRequestMethods = [
  'GET',
  'POST',
  'PUT',
  'HEAD',
  'DELETE',
  'PATCH',
  'OPTIONS',
  'CONNECT',
  'TRACE',
] as const

export type RequestMethod = (typeof validRequestMethods)[number]

export type RemoveUndefined<TType> = TType extends undefined ? never : TType

// Object keys type helper
export const objectKeys = <Obj extends object>(obj: Obj): (keyof Obj)[] => {
  return Object.keys(obj) as (keyof Obj)[]
}
