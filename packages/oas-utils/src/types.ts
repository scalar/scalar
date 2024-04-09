import type { OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-parser'
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
