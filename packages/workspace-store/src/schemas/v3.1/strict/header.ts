import { compose } from '@/schemas/v3.1/compose'
import { ExampleObjectSchema } from '@/schemas/v3.1/strict/example'
import { ExtensionsSchema } from '@/schemas/v3.1/strict/extensions'
import { ReferenceObjectSchema } from '@/schemas/v3.1/strict/reference'
import { SchemaObjectSchema } from '@/schemas/v3.1/strict/schema'
import { Type, type TSchema } from '@sinclair/typebox'

export const HeaderObjectSchemaBase = compose(
  Type.Object({
    /** A brief description of the header. This could contain examples of use. CommonMark syntax MAY be used for rich text representation. */
    description: Type.Optional(Type.String()),
    /** Determines whether this header is mandatory. The default value is false. */
    required: Type.Optional(Type.Boolean()),
    /** Specifies that the header is deprecated and SHOULD be transitioned out of usage. Default value is false. */
    deprecated: Type.Optional(Type.Boolean()),
  }),
  ExtensionsSchema,
)

export const HeaderObjectWithSchemaSchema = compose(
  HeaderObjectSchemaBase,
  Type.Object({
    /** Describes how the header value will be serialized. The default (and only legal value for headers) is "simple". */
    style: Type.Optional(Type.String()),
    /** When this is true, header values of type array or object generate a single header whose value is a comma-separated list of the array items or key-value pairs of the map, see Style Examples. For other data types this field has no effect. The default value is false. */
    explode: Type.Optional(Type.Boolean()),
    /** The schema defining the type used for the header. */
    schema: Type.Optional(Type.Union([SchemaObjectSchema, ReferenceObjectSchema])),
    /** Example of the header's potential value; see Working With Examples. https://swagger.io/specification/#working-with-examples */
    example: Type.Any(),
    /** Examples of the header's potential value; see Working With Examples. https://swagger.io/specification/#working-with-examples */
    examples: Type.Optional(Type.Record(Type.String(), Type.Union([ExampleObjectSchema, ReferenceObjectSchema]))),
  }),
)

export const headerObjectSchemaBuilder = <T extends TSchema>(mediaType: T) =>
  Type.Union([
    HeaderObjectWithSchemaSchema,
    // @ts-ignore
    compose(
      HeaderObjectSchemaBase,
      Type.Object({
        content: Type.Optional(Type.Record(Type.String(), mediaType)),
      }),
    ),
  ])
