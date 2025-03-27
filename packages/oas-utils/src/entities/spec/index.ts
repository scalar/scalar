export { collectionSchema, type Collection, type CollectionPayload } from './collection.ts'
export { serverSchema, type Server, type ServerPayload } from './server.ts'
export { requestSchema, type Request, type RequestPayload } from './requests.ts'
export {
  requestExampleSchema,
  createExampleFromRequest,
  type RequestExample,
  type RequestExampleParameter,
} from './request-examples.ts'
export {
  tagSchema,
  oasExternalDocumentationSchema,
  oasInfoSchema,
  oasContactSchema,
  oasLicenseSchema,
  type Tag,
} from './spec-objects.ts'
export { oasParameterSchema, type RequestParameter } from './parameters.ts'
export {
  type Operation,
  type OperationPayload,
  operationSchema,
} from './operation.ts'

export {
  xScalarEnvironmentsSchema,
  type XScalarEnvironment,
  type XScalarEnvironments,
} from './x-scalar-environments.ts'

/** Re-exported here for ease of use but we should use the other ones directly */
export {
  type Oauth2Flow,
  type Oauth2FlowPayload,
  type SecuritySchemaHttp,
  type SecuritySchemaOpenId,
  type SecurityScheme,
  type SecuritySchemeApiKey,
  type SecuritySchemeOauth2,
  type SecuritySchemeOauth2Payload,
  type SecuritySchemePayload,
  oasSecurityRequirementSchema,
  oasSecuritySchemeSchema,
  pkceOptions,
  securityApiKeySchema,
  securityHttpSchema,
  securityOauthSchema,
  securityOpenIdSchema,
  securitySchemeSchema,
} from '@scalar/types/entities'

type FetchRequest = Request
export type { FetchRequest }
