import Swagger20 from '@/schemas/v2.0/schema'
import OpenApi30 from '@/schemas/v3.0/schema'
import OpenApi31 from '@/schemas/v3.1/schema'
import OpenApi32 from '@/schemas/v3.2/schema'

/**
 * A list of the supported OpenAPI specifications
 */
export const OpenApiSpecifications = {
  '2.0': Swagger20,
  '3.0': OpenApi30,
  '3.1': OpenApi31,
  '3.2': OpenApi32,
}

export type OpenApiVersion = keyof typeof OpenApiSpecifications

export const OpenApiVersions = Object.keys(OpenApiSpecifications) as OpenApiVersion[]

/**
 * Error messages used by the validator.
 *
 * Kept local to this package on purpose: error messages should live where they
 * are used and be copied rather than imported across packages.
 */
export const ERRORS = {
  EMPTY_OR_INVALID: "Can't find JSON, YAML or filename in data.",
  OPENAPI_VERSION_NOT_SUPPORTED:
    "Can't find supported Swagger/OpenAPI version in the provided document, version must be a string.",
} as const
