import { literal, object, optional, string, union, unknown } from '@scalar/validation'

import { type MaybeRefFn, normalRef } from './reference'

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

const asyncApiSchemaPayloadInner = union([asyncApiMultiFormatSchemaObject, asyncApiSchemaJsonShape], {
  typeName: 'AsyncApiMultiFormatSchemaOrSchemaObject',
})

/**
 * Builds the schema payload shape (Multi Format Schema or JSON Schema) for {@link generateSchema}.
 *
 * **Reference union:** Returns `Multi Format Schema Object | Schema Object | Reference Object`.
 * Do not wrap the result in `maybeRef` again at the call site.
 *
 * @param maybeRef - `normalRef` or `recursiveRef` from `./reference`.
 */
export const createAsyncApiSchemaPayload = (maybeRef: MaybeRefFn) => maybeRef(asyncApiSchemaPayloadInner)

export const asyncApiSchemaPayload = createAsyncApiSchemaPayload(normalRef)
