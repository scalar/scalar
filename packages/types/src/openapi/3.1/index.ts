import type {
  ApiKeySecuritySchemeObject,
  AuthorizationCodeOAuthFlowObject,
  ClientCredentialsOAuthFlowObject,
  HttpSecuritySchemeObject,
  ImplicitOAuthFlowObject,
  OAuth2SecuritySchemeObject,
  OpenIdConnectSecuritySchemeObject,
  ParameterObject,
  ParameterObjectWithContent,
  ParameterObjectWithSchema,
  PasswordOAuthFlowObject,
  SchemaObject,
} from './index.generated'
import type { ReferenceType } from './reference'

export type {
  AuthorizationCodeOAuthFlowObject,
  CallbackObject,
  ClientCredentialsOAuthFlowObject,
  ComponentsObject,
  ContactObject,
  DiscriminatorObject,
  EncodingObject,
  ExampleObject,
  ExternalDocumentationObject,
  HeaderObject,
  ImplicitOAuthFlowObject,
  InfoObject,
  LicenseObject,
  LinkObject,
  MediaTypeObject,
  OAuthFlowsObject,
  OpenApiDocument,
  OpenApiExtensions,
  OpenApiSecurity,
  OperationObject,
  ParameterObject,
  ParameterObjectWithContent,
  ParameterObjectWithSchema,
  PasswordOAuthFlowObject,
  PathItemObject,
  PathsObject,
  RequestBodyObject,
  ResponseObject,
  ResponsesObject,
  SchemaObject,
  SecurityRequirementObject,
  SecuritySchemeObject,
  ServerObject,
  ServerVariableObject,
  TagObject,
  XMLObject,
} from './index.generated'
export type { ReferenceObject, ReferenceType } from './reference'

export type SchemaReferenceType = ReferenceType<SchemaObject>

export type ApiKeyObject = ApiKeySecuritySchemeObject
export type HttpObject = HttpSecuritySchemeObject
export type OAuth2Object = OAuth2SecuritySchemeObject
export type OAuthFlow =
  | ImplicitOAuthFlowObject
  | PasswordOAuthFlowObject
  | ClientCredentialsOAuthFlowObject
  | AuthorizationCodeOAuthFlowObject
export type OpenIdConnectObject = OpenIdConnectSecuritySchemeObject

export type OAuthFlowImplicit = ImplicitOAuthFlowObject
export type OAuthFlowPassword = PasswordOAuthFlowObject
export type OAuthFlowClientCredentials = ClientCredentialsOAuthFlowObject
export type OAuthFlowAuthorizationCode = AuthorizationCodeOAuthFlowObject

export const isObjectSchema = (schema: SchemaObject): schema is Extract<SchemaObject, { type: 'object' }> => {
  return (
    'type' in schema && (schema.type === 'object' || (Array.isArray(schema.type) && schema.type.includes('object')))
  )
}

export const isArraySchema = (schema: SchemaObject): schema is Extract<SchemaObject, { type: 'array' }> => {
  return 'type' in schema && (schema.type === 'array' || (Array.isArray(schema.type) && schema.type.includes('array')))
}

export const isStringSchema = (schema: SchemaObject): schema is Extract<SchemaObject, { type: 'string' }> => {
  return (
    'type' in schema && (schema.type === 'string' || (Array.isArray(schema.type) && schema.type.includes('string')))
  )
}

export const isNumberSchema = (
  schema: SchemaObject,
): schema is Extract<SchemaObject, { type: 'number' | 'integer' }> => {
  return (
    'type' in schema &&
    (schema.type === 'number' ||
      schema.type === 'integer' ||
      (Array.isArray(schema.type) && schema.type.includes('number')) ||
      (Array.isArray(schema.type) && schema.type.includes('integer')))
  )
}

/** Schema object that declares a JSON Schema `type`. */
export type SchemaObjectWithType = Extract<SchemaObject, { type: unknown }>

/** Type guard for schema objects that declare a `type`. */
export const isSchema = (schema: SchemaObject | undefined): schema is SchemaObjectWithType =>
  schema !== undefined && 'type' in schema

/**
 * Type guard to check if the given parameter is a ParameterWithContentObject,
 * i.e., it has a 'content' property defined.
 */
export const isContentTypeParameterObject = (parameter: ParameterObject): parameter is ParameterObjectWithContent => {
  return 'content' in parameter && parameter.content !== undefined
}

/** Parameter object that uses `schema` / `examples` rather than `content`. */
export const isSchemaParameterObject = (parameter: ParameterObject): parameter is ParameterObjectWithSchema => {
  return !isContentTypeParameterObject(parameter)
}
