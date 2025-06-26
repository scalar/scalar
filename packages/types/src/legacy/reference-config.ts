import type { OpenAPI, OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'

import type { ApiReferenceConfiguration } from '../api-reference/index'
import type { TargetId } from '../snippetz/index'

/**
 * This re-export is needed due to a typescript issue
 * @see https://github.com/microsoft/TypeScript/issues/42873
 */
export type {
  OpenAPI,
  OpenAPIV2,
  OpenAPIV3,
  OpenAPIV3_1,
} from '@scalar/openapi-types'

export type ClientInfo = {
  key: string
  title: string
  link: string
  description: string
}

/**
 * Alias for the OpenAPI 3.1 ServerObject type
 *
 * @deprecated Use OpenAPIV3_1.ServerObject instead
 */
export type Server = OpenAPIV3_1.ServerObject

export type TargetInfo = {
  key: TargetId
  title: string
  extname: `.${string}` | null
  default: string
}

export type HiddenClients =
  // Just hide all
  | true
  // Exclude whole targets or just specific clients
  | Partial<Record<TargetInfo['key'], boolean | ClientInfo['key'][]>>
  // Backwards compatibility with the previous behavior ['fetch', 'xhr']
  | ClientInfo['key'][]

export type PathRouting = {
  basePath: string
}

/**
 * @deprecated Use ApiReferenceConfiguration instead
 *
 * @example import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
 */
export type ReferenceConfiguration = Partial<ApiReferenceConfiguration>

export type BaseParameter = {
  name: string
  description?: string | null
  value: string | number | Record<string, any>
  required?: boolean
  enabled: boolean
}

type OptionalCharset = string | null

export type ContentType =
  | `application/json${OptionalCharset}`
  | `application/xml${OptionalCharset}`
  | `text/plain${OptionalCharset}`
  | `text/html${OptionalCharset}`
  | `application/octet-stream${OptionalCharset}`
  | `application/x-www-form-urlencoded${OptionalCharset}`
  | `multipart/form-data${OptionalCharset}`
  | `*/*${OptionalCharset}`
  | `application/vnd.${string}+json${OptionalCharset}`

export type Cookie = {
  name: string
  value: string
}

export type CustomRequestExample = {
  lang: string
  label: string
  source: string
}

export type Header = {
  name: string
  value: string
}

export enum XScalarStability {
  Deprecated = 'deprecated',
  Experimental = 'experimental',
  Stable = 'stable',
}

export type Operation = {
  id: string
  httpVerb: OpenAPIV3_1.HttpMethods
  path: string
  name: string
  isWebhook: boolean
  description?: string
  information: OpenAPIV3_1.OperationObject
  servers?: OpenAPIV3_1.ServerObject[]
  pathParameters?: OpenAPIV3_1.ParameterObject[]
}

/**
 * @deprecated Use Parameter instead
 */
export type Parameters = Parameter

export type Parameter = {
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
  content?: RequestBodyMimeTypes
  headers?: { [key: string]: OpenAPI.HeaderObject }
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

/**
 * This is a very strange and custom way to represent the operation object.
 * It's the outcome of the `parse` helper.
 *
 * @deprecated This is evil. Stop using it. We'll transition to use the new store.
 */
export type TransformedOperation = Operation & {
  pathParameters?: Parameter[]
}

export type CollapsedSidebarItems = Record<string, boolean>

export type AuthenticationState = {
  customSecurity?: boolean
  /** You can pre-select a single security scheme, multiple, or complex security using an array of arrays */
  preferredSecurityScheme?: string | (string | string[])[] | null
  securitySchemes?:
    | OpenAPIV2.SecurityDefinitionsObject
    | OpenAPIV3.ComponentsObject['securitySchemes']
    | OpenAPIV3_1.ComponentsObject['securitySchemes']
  http?: {
    basic?: {
      username?: string
      password?: string
    }
    bearer?: {
      token?: string
    }
  }
  apiKey?: {
    token?: string
  }
  oAuth2?: {
    clientId?: string
    scopes?: string[]
    accessToken?: string
    state?: string
    username?: string
    password?: string
  }
}

export type Heading = {
  depth: number
  value: string
  slug?: string
}

export type CodeBlockSSRKey = `components-scalar-code-block${number}`
export type DescriptionSectionSSRKey = `components-Content-Introduction-Description-sections${number}`

export type ScalarState = {
  'hash'?: string
  'useGlobalStore-authentication'?: AuthenticationState
  'useSidebarContent-collapsedSidebarItems'?: CollapsedSidebarItems
  [key: CodeBlockSSRKey]: string
  [key: DescriptionSectionSSRKey]: {
    heading: Heading
    content: string
  }[]
}

export type SSRState = {
  payload: {
    data: ScalarState
  }
  url: string
}

export type Tag = {
  'name': string
  'description': string
  'operations': TransformedOperation[]
  'x-displayName'?: string
}

export type TagGroup = {
  name: string
  tags: string[]
}

export type Definitions = OpenAPIV2.DefinitionsObject

/**
 * Webhook (after our super custom transformation process)
 *
 * @deprecated Let's get rid of those super custom transformed entities and use the store instead.
 */
export type Webhooks = Record<
  string,
  Record<
    OpenAPIV3_1.HttpMethods,
    TransformedOperation & {
      'x-internal'?: boolean
    }
  >
>

/**
 * The native OpenAPI Webhook object, but with the x-internal and x-scalar-ignore properties
 */
export type Webhook = (OpenAPIV3.OperationObject | OpenAPIV3_1.OperationObject) & {
  'x-internal'?: boolean
  'x-scalar-ignore'?: boolean
}

/**
 * @deprecated Use `@scalar/openapi-types` instead
 */
export type Spec = {
  'tags'?: Tag[]
  'info':
    | Partial<OpenAPIV2.Document['info']>
    | Partial<OpenAPIV3.Document['info']>
    | Partial<OpenAPIV3_1.Document['info']>
  'host'?: OpenAPIV2.Document['host']
  'basePath'?: OpenAPIV2.Document['basePath']
  'schemes'?: OpenAPIV2.Document['schemes']
  'externalDocs'?: {
    url: string
    description?: string
  }
  'servers'?: OpenAPIV3.Document['servers'] | OpenAPIV3_1.Document['servers']
  'components'?: OpenAPIV3.ComponentsObject | OpenAPIV3_1.ComponentsObject
  'webhooks'?: TransformedOperation[]
  'definitions'?: Definitions
  'swagger'?: OpenAPIV2.Document['swagger']
  'openapi'?: OpenAPIV3.Document['openapi'] | OpenAPIV3_1.Document['openapi']
  'x-tagGroups'?: TagGroup[]
  'security'?: OpenAPIV3.SecurityRequirementObject[]
}
