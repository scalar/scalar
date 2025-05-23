import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'

export type Schemas =
  | OpenAPIV2.DefinitionsObject
  | Record<string, OpenAPIV3.SchemaObject>
  | Record<string, OpenAPIV3_1.SchemaObject>
  | unknown
