import { literal, object, optional, string, union, unknown } from '@scalar/validation'

import { createSchema } from '@/openapi/3.1/schema'

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

// Share the recursive JSON Schema fields while retaining AsyncAPI's property-name discriminator.
const asyncApiSchemaJsonShape = union([literal(true), literal(false), createSchema(true, string())], {
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
