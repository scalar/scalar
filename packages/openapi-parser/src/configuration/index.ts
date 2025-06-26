import Swagger20 from '@/schemas/v2.0/schema'
import OpenApi30 from '@/schemas/v3.0/schema'
import OpenApi31 from '@/schemas/v3.1/schema'

/**
 * A list of the supported OpenAPI specifications
 */
export const OpenApiSpecifications = {
  '2.0': Swagger20,
  '3.0': OpenApi30,
  '3.1': OpenApi31,
}

export type OpenApiVersion = keyof typeof OpenApiSpecifications

export const OpenApiVersions = Object.keys(OpenApiSpecifications) as OpenApiVersion[]

/**
 * List of error messages used in the Validator
 */
export const ERRORS = {
  EMPTY_OR_INVALID: "Can't find JSON, YAML or filename in data.",
  // URI_MUST_BE_STRING: 'uri parameter or $id attribute must be a string',
  OPENAPI_VERSION_NOT_SUPPORTED:
    "Can't find supported Swagger/OpenAPI version in the provided document, version must be a string.",
  INVALID_REFERENCE: "Can't resolve reference: %s",
  EXTERNAL_REFERENCE_NOT_FOUND: "Can't resolve external reference: %s",
  FILE_DOES_NOT_EXIST: 'File does not exist: %s',
  NO_CONTENT: 'No content found',
} as const

export type ValidationError = keyof typeof ERRORS
