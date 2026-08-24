import Swagger20 from '@/schemas/v2.0/schema'
import OpenApi30 from '@/schemas/v3.0/schema'
import OpenApi31 from '@/schemas/v3.1/schema'
import OpenApi32 from '@/schemas/v3.2/schema'

/**
 * The OpenAPI/Swagger JSON Schemas supported by the validator, keyed by version.
 */
export const OpenApiSpecifications = {
  '2.0': Swagger20,
  '3.0': OpenApi30,
  '3.1': OpenApi31,
  '3.2': OpenApi32,
}

export type OpenApiVersion = keyof typeof OpenApiSpecifications

export const OpenApiVersions = Object.keys(OpenApiSpecifications) as OpenApiVersion[]
