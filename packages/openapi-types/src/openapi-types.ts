/**
 * These types are copied from openapi-types, with two modifications:
 *
 * - all attributes are optional, you can't rely on the specification for user input
 * - extensions (basically any attributes, not only prefixed with an `x-`) are allowed
 *
 * We deal with user input and can't assume they really stick to any official specification.
 */

/** any other attribute, for example x-* extensions */
type AnyOtherAttribute = {
  /** OpenAPI extension */
  [customExtension: `x-${string}`]: any
  /** Unknown attribute */
  [key: string]: any
}

// biome-ignore lint/style/noNamespace: We want it to be a module here.
export namespace OpenAPI {
  // OpenAPI extensions can be declared using generics
  // e.g.:
  // OpenAPI.Document<{
  //   'x-foobar': Foobar
  // }>
  export type Document<T extends AnyOtherAttribute = {}> =
    | OpenAPIV2.Document<T>
    | OpenAPIV3.Document<T>
    | OpenAPIV3_1.Document<T>

  export type Operation<T = {}> =
    | OpenAPIV2.OperationObject<T>
    | OpenAPIV3.OperationObject<T>
    | OpenAPIV3_1.OperationObject<T>

  export type Request = {
    body?: any
    headers?: object
    params?: object
    query?: object
  }

  export type ResponseObject = OpenAPIV2.ResponseObject | OpenAPIV3.ResponseObject | OpenAPIV3_1.ResponseObject

  export type HeaderObject = OpenAPIV2.HeaderObject | OpenAPIV3.HeaderObject | OpenAPIV3_1.HeaderObject

  export type Parameter =
    | OpenAPIV3_1.ReferenceObject
    | OpenAPIV3_1.ParameterObject
    | OpenAPIV3.ReferenceObject
    | OpenAPIV3.ParameterObject
    | OpenAPIV2.ReferenceObject
    | OpenAPIV2.Parameter

  export type Parameters =
    | (OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.ParameterObject)[]
    | (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[]
    | (OpenAPIV2.ReferenceObject | OpenAPIV2.Parameter)[]

  export type ExampleObject = OpenAPIV2.ExampleObject | OpenAPIV3.ExampleObject | OpenAPIV3_1.ExampleObject

  export type SchemaObject = OpenAPIV2.SchemaObject | OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject

  export type HttpMethod = keyof typeof OpenAPIV2.HttpMethods | OpenAPIV3.HttpMethods | OpenAPIV3_1.HttpMethods
}

// biome-ignore lint/style/noNamespace: We want it to be a module here.
export namespace OpenAPIV3_1 {
  type Modify<T, R> = Omit<T, keyof R> & R

  type PathsWebhooksComponents<T = {}> = {
    paths?: PathsObject<T>
    webhooks?: Record<string, PathItemObject | ReferenceObject>
    components?: ComponentsObject
  }

  export type Document<T = {}> = Modify<
    Omit<OpenAPIV3.Document<T>, 'paths' | 'components'>,
    {
      /**
       * Version of the OpenAPI specification
       * @see https://github.com/OAI/OpenAPI-Specification/tree/main/versions
       */
      openapi?: '3.1.0' | '3.1.1'
      swagger?: undefined
      info?: InfoObject
      jsonSchemaDialect?: string
      servers?: ServerObject[]
    } & (
      | (Pick<PathsWebhooksComponents<T>, 'paths'> & Omit<Partial<PathsWebhooksComponents<T>>, 'paths'>)
      | (Pick<PathsWebhooksComponents<T>, 'webhooks'> & Omit<Partial<PathsWebhooksComponents<T>>, 'webhooks'>)
      | (Pick<PathsWebhooksComponents<T>, 'components'> & Omit<Partial<PathsWebhooksComponents<T>>, 'components'>)
    ) &
      T &
      AnyOtherAttribute
  >

  export type InfoObject = Modify<
    OpenAPIV3.InfoObject,
    {
      summary?: string
      license?: LicenseObject
    }
  >

  export type ContactObject = OpenAPIV3.ContactObject

  export type LicenseObject = Modify<
    OpenAPIV3.LicenseObject,
    {
      identifier?: string
    }
  >

  export type ServerObject = Modify<
    OpenAPIV3.ServerObject,
    {
      url?: string
      description?: string
      variables?: Record<string, ServerVariableObject>
    }
  >

  export type ServerVariableObject = Modify<
    OpenAPIV3.ServerVariableObject,
    {
      enum?: [string, ...string[]]
    }
  >

  export type PathsObject<T = {}, P extends {} = {}> = Record<string, (PathItemObject<T> & P) | undefined>

  export type HttpMethods = OpenAPIV3.HttpMethods

  export type PathItemObject<T = {}> = Modify<
    OpenAPIV3.PathItemObject<T>,
    {
      servers?: ServerObject[]
      parameters?: (ReferenceObject | ParameterObject)[]
    }
  > & {
    [method in HttpMethods]?: OperationObject<T>
  }

  export type OperationObject<T = {}> = Modify<
    OpenAPIV3.OperationObject<T>,
    {
      parameters?: (ReferenceObject | ParameterObject)[]
      requestBody?: ReferenceObject | RequestBodyObject
      responses?: ResponsesObject
      callbacks?: Record<string, ReferenceObject | CallbackObject>
      servers?: ServerObject[]
    }
  > &
    T

  export type ExternalDocumentationObject = OpenAPIV3.ExternalDocumentationObject

  export type ParameterObject = OpenAPIV3.ParameterObject

  export type HeaderObject = OpenAPIV3.HeaderObject

  export type ParameterBaseObject = OpenAPIV3.ParameterBaseObject

  export type NonArraySchemaObjectType = OpenAPIV3.NonArraySchemaObjectType | 'null'

  export type ArraySchemaObjectType = OpenAPIV3.ArraySchemaObjectType

  /**
   * There is no way to tell typescript to require items when type is either 'array' or array containing 'array' type
   * 'items' will be always visible as optional
   * Casting schema object to ArraySchemaObject or NonArraySchemaObject will work fine
   */
  export type SchemaObject = (ArraySchemaObject | NonArraySchemaObject | MixedSchemaObject | boolean) &
    AnyOtherAttribute

  export type ArraySchemaObject = {
    type?: ArraySchemaObjectType
    items?: ReferenceObject | SchemaObject
  } & BaseSchemaObject

  export type NonArraySchemaObject = {
    type?: NonArraySchemaObjectType
  } & BaseSchemaObject

  type MixedSchemaObject = {
    type?: (ArraySchemaObjectType | NonArraySchemaObjectType)[]
    items?: ReferenceObject | SchemaObject
  } & BaseSchemaObject

  export type BaseSchemaObject = Modify<
    Omit<OpenAPIV3.BaseSchemaObject, 'nullable'>,
    {
      examples?: OpenAPIV3.BaseSchemaObject['example'][]
      exclusiveMinimum?: boolean | number
      exclusiveMaximum?: boolean | number
      contentMediaType?: string
      $schema?: string
      additionalProperties?: boolean | ReferenceObject | SchemaObject
      properties?: {
        [name: string]: ReferenceObject | SchemaObject
      }
      patternProperties?: {
        [name: string]: ReferenceObject | SchemaObject
      }
      allOf?: (ReferenceObject | SchemaObject)[]
      oneOf?: (ReferenceObject | SchemaObject)[]
      anyOf?: (ReferenceObject | SchemaObject)[]
      not?: ReferenceObject | SchemaObject
      discriminator?: DiscriminatorObject
      externalDocs?: ExternalDocumentationObject
      xml?: XMLObject
      const?: any
    }
  >

  export type DiscriminatorObject = OpenAPIV3.DiscriminatorObject

  export type XMLObject = OpenAPIV3.XMLObject

  export type ReferenceObject = Modify<
    OpenAPIV3.ReferenceObject,
    {
      summary?: string
      description?: string
    }
  >

  export type ExampleObject = OpenAPIV3.ExampleObject

  export type MediaTypeObject = Modify<
    OpenAPIV3.MediaTypeObject,
    {
      schema?: SchemaObject | ReferenceObject
      examples?: Record<string, ReferenceObject | ExampleObject>
    }
  >

  export type EncodingObject = OpenAPIV3.EncodingObject

  export type RequestBodyObject = Modify<
    OpenAPIV3.RequestBodyObject,
    {
      content?: { [media: string]: MediaTypeObject }
    }
  >

  export type ResponsesObject = Record<string, ReferenceObject | ResponseObject>

  export type ResponseObject = Modify<
    OpenAPIV3.ResponseObject,
    {
      headers?: { [header: string]: ReferenceObject | HeaderObject }
      content?: { [media: string]: MediaTypeObject }
      links?: { [link: string]: ReferenceObject | LinkObject }
    }
  >

  export type LinkObject = Modify<
    OpenAPIV3.LinkObject,
    {
      server?: ServerObject
    }
  >

  export type CallbackObject = Record<string, PathItemObject | ReferenceObject>

  export type SecurityRequirementObject = OpenAPIV3.SecurityRequirementObject

  export type ComponentsObject = Modify<
    OpenAPIV3.ComponentsObject,
    {
      schemas?: Record<string, SchemaObject>
      responses?: Record<string, ReferenceObject | ResponseObject>
      parameters?: Record<string, ReferenceObject | ParameterObject>
      examples?: Record<string, ReferenceObject | ExampleObject>
      requestBodies?: Record<string, ReferenceObject | RequestBodyObject>
      headers?: Record<string, ReferenceObject | HeaderObject>
      securitySchemes?: Record<string, ReferenceObject | SecuritySchemeObject>
      links?: Record<string, ReferenceObject | LinkObject>
      callbacks?: Record<string, ReferenceObject | CallbackObject>
      pathItems?: Record<string, ReferenceObject | PathItemObject>
    }
  >

  export type SecuritySchemeObject = OpenAPIV3.SecuritySchemeObject

  export type HttpSecurityScheme = OpenAPIV3.HttpSecurityScheme

  export type ApiKeySecurityScheme = OpenAPIV3.ApiKeySecurityScheme

  export type OAuth2SecurityScheme = OpenAPIV3.OAuth2SecurityScheme

  export type OpenIdSecurityScheme = OpenAPIV3.OpenIdSecurityScheme

  export type TagObject = OpenAPIV3.TagObject
}

// biome-ignore lint/style/noNamespace: We want it to be a module here.
export namespace OpenAPIV3 {
  export type Document<T = {}> = {
    /**
     * Version of the OpenAPI specification
     * @see https://github.com/OAI/OpenAPI-Specification/tree/main/versions
     */
    openapi?: '3.0.0' | '3.0.1' | '3.0.2' | '3.0.3' | '3.0.4'
    swagger?: undefined
    info?: InfoObject
    servers?: ServerObject[]
    paths?: PathsObject<T>
    components?: ComponentsObject
    security?: SecurityRequirementObject[]
    tags?: TagObject[]
    externalDocs?: ExternalDocumentationObject
  } & T &
    AnyOtherAttribute

  export type InfoObject = {
    title?: string
    description?: string
    termsOfService?: string
    contact?: ContactObject
    license?: LicenseObject
    version?: string
  }

  export type ContactObject = {
    name?: string
    url?: string
    email?: string
  }

  export type LicenseObject = {
    name?: string
    url?: string
  }

  export type ServerObject = {
    url?: string
    description?: string
    variables?: { [variable: string]: ServerVariableObject }
  }

  export type ServerVariableObject = {
    enum?: string[] | number[]
    default?: string | number
    description?: string
  }

  export type PathsObject<T = {}, P extends {} = {}> = {
    [pattern: string]: (PathItemObject<T> & P) | undefined
  }

  // All HTTP methods allowed by OpenAPI 3 spec
  // See https://swagger.io/specification/#path-item-object
  // You can use keys or values from it in TypeScript code like this:
  //     for (const method of Object.values(OpenAPIV3.HttpMethods)) { … }
  export type HttpMethods = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace' | 'connect'

  export type PathItemObject<T = {}> = {
    $ref?: string
    summary?: string
    description?: string
    servers?: ServerObject[]
    parameters?: (ReferenceObject | ParameterObject)[]
  } & {
    [method in HttpMethods]?: OperationObject<T>
  } & T &
    AnyOtherAttribute

  export type OperationObject<T = {}> = {
    tags?: string[]
    summary?: string
    description?: string
    externalDocs?: ExternalDocumentationObject
    operationId?: string
    parameters?: (ReferenceObject | ParameterObject)[]
    requestBody?: ReferenceObject | RequestBodyObject
    responses?: ResponsesObject
    callbacks?: { [callback: string]: ReferenceObject | CallbackObject }
    deprecated?: boolean
    security?: SecurityRequirementObject[]
    servers?: ServerObject[]
  } & T &
    AnyOtherAttribute

  export type ExternalDocumentationObject = {
    description?: string
    url?: string
  }

  export type ParameterObject = {
    name?: string
    in?: string
  } & ParameterBaseObject

  export type HeaderObject = {} & ParameterBaseObject

  export type ParameterBaseObject = {
    description?: string
    required?: boolean
    deprecated?: boolean
    allowEmptyValue?: boolean
    style?: string
    explode?: boolean
    allowReserved?: boolean
    schema?: ReferenceObject | SchemaObject
    example?: any
    examples?: { [media: string]: ReferenceObject | ExampleObject }
    content?: { [media: string]: MediaTypeObject }
  }
  export type NonArraySchemaObjectType = 'boolean' | 'object' | 'number' | 'string' | 'integer'
  export type ArraySchemaObjectType = 'array'
  export type SchemaObject = (ArraySchemaObject | NonArraySchemaObject) & AnyOtherAttribute

  export type ArraySchemaObject = {
    type?: ArraySchemaObjectType
    items?: ReferenceObject | SchemaObject
  } & BaseSchemaObject

  export type NonArraySchemaObject = {
    type?: NonArraySchemaObjectType
  } & BaseSchemaObject

  export type BaseSchemaObject = {
    // JSON schema allowed properties, adjusted for OpenAPI
    title?: string
    description?: string
    format?: string
    default?: any
    multipleOf?: number
    maximum?: number
    exclusiveMaximum?: boolean
    minimum?: number
    exclusiveMinimum?: boolean
    maxLength?: number
    minLength?: number
    pattern?: string
    additionalProperties?: boolean | ReferenceObject | SchemaObject
    maxItems?: number
    minItems?: number
    uniqueItems?: boolean
    maxProperties?: number
    minProperties?: number
    required?: string[]
    enum?: any[]
    properties?: {
      [name: string]: ReferenceObject | SchemaObject
    }
    patternProperties?: {
      [name: string]: ReferenceObject | SchemaObject
    }
    allOf?: (ReferenceObject | SchemaObject)[]
    oneOf?: (ReferenceObject | SchemaObject)[]
    anyOf?: (ReferenceObject | SchemaObject)[]
    not?: ReferenceObject | SchemaObject

    // OpenAPI-specific properties
    nullable?: boolean
    discriminator?: DiscriminatorObject
    readOnly?: boolean
    writeOnly?: boolean
    xml?: XMLObject
    externalDocs?: ExternalDocumentationObject
    example?: any
    deprecated?: boolean
  }

  export type DiscriminatorObject = {
    propertyName?: string
    mapping?: { [value: string]: string }
  }

  export type XMLObject = {
    name?: string
    namespace?: string
    prefix?: string
    attribute?: boolean
    wrapped?: boolean
  }

  export type ReferenceObject = {
    $ref?: string
  } & AnyOtherAttribute

  export type ExampleObject = {
    summary?: string
    description?: string
    value?: any
    externalValue?: string
  }

  export type MediaTypeObject = {
    schema?: ReferenceObject | SchemaObject
    example?: any
    examples?: { [media: string]: ReferenceObject | ExampleObject }
    encoding?: { [media: string]: EncodingObject }
  }

  export type EncodingObject = {
    contentType?: string
    headers?: { [header: string]: ReferenceObject | HeaderObject }
    style?: string
    explode?: boolean
    allowReserved?: boolean
  }

  export type RequestBodyObject = {
    description?: string
    content?: { [media: string]: MediaTypeObject }
    required?: boolean
  }

  export type ResponsesObject = {
    [code: string]: ReferenceObject | ResponseObject
  }

  export type ResponseObject = {
    description?: string
    headers?: { [header: string]: ReferenceObject | HeaderObject }
    content?: { [media: string]: MediaTypeObject }
    links?: { [link: string]: ReferenceObject | LinkObject }
  } & AnyOtherAttribute

  export type LinkObject = {
    operationRef?: string
    operationId?: string
    parameters?: { [parameter: string]: any }
    requestBody?: any
    description?: string
    server?: ServerObject
  }

  export type CallbackObject = {
    [url: string]: PathItemObject
  }

  export type SecurityRequirementObject = {
    [name: string]: string[]
  }

  export type ComponentsObject = {
    schemas?: { [key: string]: ReferenceObject | SchemaObject }
    responses?: { [key: string]: ReferenceObject | ResponseObject }
    parameters?: { [key: string]: ReferenceObject | ParameterObject }
    examples?: { [key: string]: ReferenceObject | ExampleObject }
    requestBodies?: { [key: string]: ReferenceObject | RequestBodyObject }
    headers?: { [key: string]: ReferenceObject | HeaderObject }
    securitySchemes?: { [key: string]: ReferenceObject | SecuritySchemeObject }
    links?: { [key: string]: ReferenceObject | LinkObject }
    callbacks?: { [key: string]: ReferenceObject | CallbackObject }
  }

  export type SecuritySchemeObject =
    | HttpSecurityScheme
    | ApiKeySecurityScheme
    | OAuth2SecurityScheme
    | OpenIdSecurityScheme

  export type HttpSecurityScheme = {
    type?: 'http'
    description?: string
    scheme?: string
    bearerFormat?: string
  } & AnyOtherAttribute

  export type ApiKeySecurityScheme = {
    type?: 'apiKey'
    description?: string
    name?: string
    in?: string
  } & AnyOtherAttribute

  export type OAuth2SecurityScheme = {
    type?: 'oauth2'
    description?: string
    flows?: {
      implicit?: {
        authorizationUrl?: string
        refreshUrl?: string
        scopes?: { [scope: string]: string }
      } & AnyOtherAttribute
      password?: {
        tokenUrl?: string
        refreshUrl?: string
        scopes?: { [scope: string]: string }
      } & AnyOtherAttribute
      clientCredentials?: {
        tokenUrl?: string
        refreshUrl?: string
        scopes?: { [scope: string]: string }
      } & AnyOtherAttribute
      authorizationCode?: {
        authorizationUrl?: string
        tokenUrl?: string
        refreshUrl?: string
        scopes?: { [scope: string]: string }
      } & AnyOtherAttribute
    }
  }

  export type OpenIdSecurityScheme = {
    type?: 'openIdConnect'
    description?: string
    openIdConnectUrl?: string
  } & AnyOtherAttribute

  export type TagObject = {
    name?: string
    description?: string
    externalDocs?: ExternalDocumentationObject
  } & AnyOtherAttribute
}

// biome-ignore lint/style/noNamespace: We want it to be a module here.
export namespace OpenAPIV2 {
  export type Document<T = {}> = {
    /**
     * Version of the OpenAPI specification
     * @see https://github.com/OAI/OpenAPI-Specification/tree/main/versions
     */
    swagger?: '2.0'
    openapi?: never
    basePath?: string
    consumes?: MimeTypes
    definitions?: DefinitionsObject
    externalDocs?: ExternalDocumentationObject
    host?: string
    info?: InfoObject
    parameters?: ParametersDefinitionsObject
    paths?: PathsObject<T>
    produces?: MimeTypes
    responses?: ResponsesDefinitionsObject
    schemes?: string[]
    security?: SecurityRequirementObject[]
    securityDefinitions?: SecurityDefinitionsObject
    tags?: TagObject[]
  } & T &
    AnyOtherAttribute

  export type TagObject = {
    name?: string
    description?: string
    externalDocs?: ExternalDocumentationObject
  } & AnyOtherAttribute

  export type SecuritySchemeObjectBase = {
    type?: 'basic' | 'apiKey' | 'oauth2'
    description?: string
  }

  export type SecuritySchemeBasic = {
    type?: 'basic'
  } & SecuritySchemeObjectBase

  export type SecuritySchemeApiKey = {
    type?: 'apiKey'
    name?: string
    in?: string
  } & SecuritySchemeObjectBase

  export type SecuritySchemeOauth2 =
    | SecuritySchemeOauth2Implicit
    | SecuritySchemeOauth2AccessCode
    | SecuritySchemeOauth2Password
    | SecuritySchemeOauth2Application

  export type ScopesObject = {
    [index: string]: any
  }

  export type SecuritySchemeOauth2Base = {
    type?: 'oauth2'
    flow?: 'implicit' | 'password' | 'application' | 'accessCode'
    scopes?: ScopesObject
  } & SecuritySchemeObjectBase

  export type SecuritySchemeOauth2Implicit = {
    flow?: 'implicit'
    authorizationUrl?: string
  } & SecuritySchemeOauth2Base

  export type SecuritySchemeOauth2AccessCode = {
    flow?: 'accessCode'
    authorizationUrl?: string
    tokenUrl?: string
  } & SecuritySchemeOauth2Base

  export type SecuritySchemeOauth2Password = {
    flow?: 'password'
    tokenUrl?: string
  } & SecuritySchemeOauth2Base

  export type SecuritySchemeOauth2Application = {
    flow?: 'application'
    tokenUrl?: string
  } & SecuritySchemeOauth2Base

  export type SecuritySchemeObject = SecuritySchemeBasic | SecuritySchemeApiKey | SecuritySchemeOauth2

  export type SecurityDefinitionsObject = {
    [index: string]: SecuritySchemeObject
  }

  export type SecurityRequirementObject = {
    [index: string]: string[]
  }

  export type ReferenceObject = {
    $ref: string
  } & AnyOtherAttribute

  export type Response = ResponseObject | ReferenceObject

  export type ResponsesDefinitionsObject = {
    [index: string]: ResponseObject
  }

  export type Schema = SchemaObject | ReferenceObject

  export type ResponseObject = {
    description?: string
    schema?: Schema
    headers?: HeadersObject
    examples?: ExampleObject
  } & AnyOtherAttribute

  export type HeadersObject = {
    [index: string]: HeaderObject
  }

  export type HeaderObject = {
    description?: string
  } & ItemsObject

  export type ExampleObject = {
    [index: string]: any
  }

  export type OperationObject<T = {}> = {
    tags?: string[]
    summary?: string
    description?: string
    externalDocs?: ExternalDocumentationObject
    operationId?: string
    consumes?: MimeTypes
    produces?: MimeTypes
    parameters?: Parameters
    responses: ResponsesObject
    schemes?: string[]
    deprecated?: boolean
    security?: SecurityRequirementObject[]
  } & T &
    AnyOtherAttribute

  export type ResponsesObject = {
    [index: string]: Response | undefined
    default?: Response
  }

  export type Parameters = (ReferenceObject | Parameter)[]

  export type Parameter = InBodyParameterObject | GeneralParameterObject

  export type InBodyParameterObject = {
    schema?: Schema
  } & ParameterObject

  export type GeneralParameterObject = {
    allowEmptyValue?: boolean
  } & ParameterObject &
    ItemsObject

  // All HTTP methods allowed by OpenAPI 2 spec
  // See https://swagger.io/specification/v2#path-item-object
  // You can use keys or values from it in TypeScript code like this:
  //     for (const method of Object.values(OpenAPIV2.HttpMethods)) { … }
  export enum HttpMethods {
    GET = 'get',
    PUT = 'put',
    POST = 'post',
    DELETE = 'delete',
    OPTIONS = 'options',
    HEAD = 'head',
    PATCH = 'patch',
  }

  export type PathItemObject<T = {}> = {
    $ref?: string
    parameters?: Parameters
  } & {
    [method in HttpMethods]?: OperationObject<T>
  }

  export type PathsObject<T = {}> = {
    [index: string]: PathItemObject<T>
  }

  export type ParametersDefinitionsObject = {
    [index: string]: ParameterObject
  }

  export type ParameterObject = {
    name?: string
    in?: string
    description?: string
    required?: boolean
    [index: string]: any
  }

  export type MimeTypes = string[]

  export type DefinitionsObject = {
    [index: string]: SchemaObject
  }

  export type SchemaObject = {
    [index: string]: any
    discriminator?: string
    readOnly?: boolean
    xml?: XMLObject
    externalDocs?: ExternalDocumentationObject
    example?: any
    default?: any
    items?: ItemsObject | ReferenceObject
    properties?: {
      [name: string]: SchemaObject
    }
  } & IJsonSchema

  export type ExternalDocumentationObject = {
    [index: string]: any
    description?: string
    url?: string
  }

  export type ItemsObject = {
    type?: string
    format?: string
    items?: ItemsObject | ReferenceObject
    collectionFormat?: string
    default?: any
    maximum?: number
    exclusiveMaximum?: boolean
    minimum?: number
    exclusiveMinimum?: boolean
    maxLength?: number
    minLength?: number
    pattern?: string
    maxItems?: number
    minItems?: number
    uniqueItems?: boolean
    enum?: any[]
    multipleOf?: number
    $ref?: string
  }

  export type XMLObject = {
    [index: string]: any
    name?: string
    namespace?: string
    prefix?: string
    attribute?: boolean
    wrapped?: boolean
  }

  export type InfoObject = {
    title?: string
    description?: string
    termsOfService?: string
    contact?: ContactObject
    license?: LicenseObject
    version?: string
  }

  export type ContactObject = {
    name?: string
    url?: string
    email?: string
  }

  export type LicenseObject = {
    name?: string
    url?: string
  }
}

export type IJsonSchema = {
  id?: string
  $schema?: string
  title?: string
  description?: string
  multipleOf?: number
  maximum?: number
  exclusiveMaximum?: boolean
  minimum?: number
  exclusiveMinimum?: boolean
  maxLength?: number
  minLength?: number
  pattern?: string
  additionalItems?: boolean | IJsonSchema
  items?: IJsonSchema | IJsonSchema[]
  maxItems?: number
  minItems?: number
  uniqueItems?: boolean
  maxProperties?: number
  minProperties?: number
  required?: string[]
  additionalProperties?: boolean | IJsonSchema
  definitions?: {
    [name: string]: IJsonSchema
  }
  properties?: {
    [name: string]: IJsonSchema
  }
  patternProperties?: {
    [name: string]: IJsonSchema
  }
  dependencies?: {
    [name: string]: IJsonSchema | string[]
  }
  enum?: any[]
  type?: string | string[]
  allOf?: IJsonSchema[]
  anyOf?: IJsonSchema[]
  oneOf?: IJsonSchema[]
  not?: IJsonSchema
  $ref?: string
} & AnyOtherAttribute
