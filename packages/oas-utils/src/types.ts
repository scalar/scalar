import {
  type OpenAPIV2,
  type OpenAPIV3,
  type OpenAPIV3_1,
  type ResolvedOpenAPIV2,
  type ResolvedOpenAPIV3,
  type ResolvedOpenAPIV3_1,
} from '@scalar/openapi-parser'
import type { HarRequest } from 'httpsnippet-lite'
import { z } from 'zod'

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
  httpVerb: string
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

export type CollapsedSidebarItems = Record<string, boolean>

export type AuthenticationState = {
  customSecurity: boolean
  preferredSecurityScheme: string | null
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

export type Heading = {
  depth: number
  value: string
  slug?: string
}

export type CodeBlockSSRKey = `components-scalar-code-block${number}`
export type DescriptionSectionSSRKey =
  `components-Content-Introduction-Description-sections${number}`
export type ExampleRequestSSRKey =
  `components-Content-Operation-Example-Request${number}`

export type ScalarState = {
  'hash'?: string
  'useGlobalStore-authentication'?: AuthenticationState
  'useSidebarContent-collapsedSidebarItems'?: CollapsedSidebarItems
  [key: CodeBlockSSRKey]: string
  [key: DescriptionSectionSSRKey]: {
    heading: Heading
    content: string
  }[]
  [key: ExampleRequestSSRKey]: string
}

export type SSRState = {
  payload: {
    data: ScalarState
  }
  url: string
}

export type RequestMethod = (typeof validRequestMethods)[number]

// Scalar Parse Types -------------------------------------------------------

export type RemoveUndefined<TType> = TType extends undefined ? never : TType

export type Spec = {
  'paths'?: PathsObject
  'tags'?: z.infer<typeof tagSchema>[]
  'info'?:
    | Partial<OpenAPIV2.Document['info']>
    | Partial<OpenAPIV3.Document['info']>
    | Partial<OpenAPIV3_1.Document['info']>
  'host'?: OpenAPIV2.Document['host']
  'basePath'?: OpenAPIV2.Document['basePath']
  'schemes'?: OpenAPIV2.Document['schemes']
  'externalDocs'?: ExternalDocs
  'servers'?: Server[]
  'components'?: OpenAPIV3.ComponentsObject | OpenAPIV3_1.ComponentsObject
  'webhooks'?: z.infer<typeof webhooksSchema>
  'definitions'?: Definitions
  'swagger'?: OpenAPIV2.Document['swagger']
  'openapi'?: OpenAPIV3.Document['openapi'] | OpenAPIV3_1.Document['openapi']
  'x-tagGroups'?: TagGroup[]
  'security'?: OpenAPIV3.SecurityRequirementObject[]
}

export type PathsObject = Record<
  string,
  | ResolvedOpenAPIV3_1.PathsObject
  | ResolvedOpenAPIV2.PathsObject
  | ResolvedOpenAPIV3.PathsObject
>

export type TagGroup = {
  name: string
  tags: string[]
}

export type Tag = {
  name: string
  description: string
  externalDocs?: ExternalDocs
  operations: TransformedOperation[]
}

export const tagSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  externalDocs: z.record(z.any(), z.any()).optional(),
  // make this any because it is being validated in the parser
  // but also the original unkown data is being appended in the information field
  operations: z.array(z.any()).optional().default([]),
})

export type ExternalDocs = {
  description?: string
  url?: string
}

export type Server = {
  url: string
  description?: string
  variables?: ServerVariables
}

export type ServerVariables = Record<
  string,
  {
    default?: string | number
    description?: string
    enum?: (string | number)[]
  }
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

export const requestMethodSchema = z.enum(validRequestMethods)

export const operationSchema = z.object({
  httpVerb: requestMethodSchema.optional(),
  operationId: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  information: z.record(z.any(), z.any()).optional(),
  summary: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export const parameterSchema = z.object({
  name: z.string(),
  in: z.string().optional(),
  description: z.string().optional(),
  required: z.boolean().optional(),
  allowEmptyValue: z.boolean().optional(),
  style: z.enum(['form', 'simple']).optional(),
  explode: z.boolean().optional(),
  allowReserved: z.boolean().optional(),
  schema: z.record(z.any(), z.any()).optional(),
  example: z.any().optional(),
  examples: z.record(z.string(), z.any()).optional(),
})

export const transformedOperationSchema = operationSchema.extend({
  pathParameters: z.array(parameterSchema).optional(),
})

export const webhooksSchema = z.record(
  requestMethodSchema,
  transformedOperationSchema,
)

export type Definitions = OpenAPIV2.DefinitionsObject

// Object keys type helper
export const objectKeys = <Obj extends object>(obj: Obj): (keyof Obj)[] => {
  return Object.keys(obj) as (keyof Obj)[]
}
