import { literal, object, optional, string, union, unknown } from '@scalar/validation'

import { normalRef } from './reference'

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

const asyncApiSchemaJsonShape = union(
  [
    literal(true),
    literal(false),
    unknown({
      typeName: 'AsyncApiSchemaObject',
      typeComment: 'JSON Schema Draft 07 compatible schema (boolean true/false or object); see AsyncAPI Schema Object.',
    }),
  ],
  { typeName: 'AsyncApiSchemaJsonShape' },
)

/** Multi Format Schema Object | Schema Object | Reference Object */
export const asyncApiSchemaPayload = normalRef(
  union([asyncApiMultiFormatSchemaObject, asyncApiSchemaJsonShape], {
    typeName: 'AsyncApiMultiFormatSchemaOrSchemaObject',
  }),
)
