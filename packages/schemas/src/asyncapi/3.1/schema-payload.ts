import { literal, object, optional, string, union, unknown } from '@scalar/validation'

import { schema as schemaObject } from '@/openapi/3.1/schema'

import { recursiveRef } from './reference'

export const asyncApiMultiFormatSchemaObject = object(
  {
    schemaFormat: optional(
      string({
        typeComment:
          'Media type identifying the schema format. When omitted, defaults to the AsyncAPI JSON Schema vocabulary for the document version.',
      }),
    ),
    schema: unknown({
      typeComment: 'REQUIRED. Schema definition in the format given by schemaFormat.',
    }),
  },
  { typeName: 'AsyncApiMultiFormatSchemaObject' },
)

// AsyncAPI's default schema format is JSON Schema, the same dialect OpenAPI 3.1 uses, so we reuse the
// OpenAPI Schema Object here instead of an opaque `unknown`. A schema may also be a boolean per JSON Schema.
const asyncApiSchemaJsonShape = union([literal(true), literal(false), schemaObject], {
  typeName: 'AsyncApiSchemaJsonShape',
})

/** Schema Object | Reference Object */
export const asyncApiSchemaObjectOrReference = recursiveRef(asyncApiSchemaJsonShape)

/** Multi Format Schema Object | Schema Object | Reference Object */
export const asyncApiSchemaPayload = recursiveRef(
  union([asyncApiMultiFormatSchemaObject, asyncApiSchemaJsonShape], {
    typeName: 'AsyncApiMultiFormatSchemaOrSchemaObject',
  }),
)
