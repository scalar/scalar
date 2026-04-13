import type { OpenAPIV3_1 } from '@scalar/openapi-types'

export const isReferenceObject = (value: unknown): value is OpenAPIV3_1.ReferenceObject =>
  !!value && typeof value === 'object' && '$ref' in value

export const isSecuritySchemeObject = (
  scheme: OpenAPIV3_1.SecuritySchemeObject | OpenAPIV3_1.ReferenceObject,
): scheme is OpenAPIV3_1.SecuritySchemeObject => !isReferenceObject(scheme)

export const isOauth2SecurityScheme = (
  scheme: OpenAPIV3_1.SecuritySchemeObject | OpenAPIV3_1.ReferenceObject,
): scheme is OpenAPIV3_1.TypeOauth2Object => !isReferenceObject(scheme) && scheme.type === 'oauth2'

export const isResponseObject = (
  response: OpenAPIV3_1.ResponseObject | OpenAPIV3_1.ReferenceObject | undefined,
): response is OpenAPIV3_1.ResponseObject => !!response && !isReferenceObject(response)

export const isHeaderWithSchema = (
  header: OpenAPIV3_1.HeaderObject | OpenAPIV3_1.ReferenceObject | undefined,
): header is OpenAPIV3_1.HeaderWithSchemaObject => !!header && !isReferenceObject(header) && 'schema' in header
