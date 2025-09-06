import { Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'
import { ExampleObjectRef, MediaTypeObjectRef, SchemaObjectRef } from '@/schemas/v3.1/strict/ref-definitions'
import { reference } from '@/schemas/v3.1/strict/reference'

export const HeaderObjectSchemaBase = Type.Object({
  /** A brief description of the header. This could contain examples of use. CommonMark syntax MAY be used for rich text representation. */
  description: Type.Optional(Type.String()),
  /** Determines whether this header is mandatory. The default value is false. */
  required: Type.Optional(Type.Boolean()),
  /** Specifies that the header is deprecated and SHOULD be transitioned out of usage. Default value is false. */
  deprecated: Type.Optional(Type.Boolean()),
})

export const HeaderObjectWithSchemaSchema = compose(
  HeaderObjectSchemaBase,
  Type.Object({
    /** Describes how the header value will be serialized. The default (and only legal value for headers) is "simple". */
    style: Type.Optional(Type.String()),
    /** When this is true, header values of type array or object generate a single header whose value is a comma-separated list of the array items or key-value pairs of the map, see Style Examples. For other data types this field has no effect. The default value is false. */
    explode: Type.Optional(Type.Boolean()),
    /** The schema defining the type used for the header. */
    schema: Type.Optional(Type.Union([SchemaObjectRef, reference(SchemaObjectRef)])),
    /** Example of the header's potential value; see Working With Examples. https://swagger.io/specification/#working-with-examples */
    example: Type.Optional(Type.Any()),
    /** Examples of the header's potential value; see Working With Examples. https://swagger.io/specification/#working-with-examples */
    examples: Type.Optional(Type.Record(Type.String(), Type.Union([ExampleObjectRef, reference(ExampleObjectRef)]))),
  }),
)

/**
 * Describes a single header for HTTP responses and for individual parts in multipart representations; see the relevant Response Object and Encoding Object documentation for restrictions on which headers can be described.
 *
 * The Header Object follows the structure of the Parameter Object, including determining its serialization strategy based on whether schema or content is present, with the following changes:
 *
 *    - name MUST NOT be specified, it is given in the corresponding headers map.
 *    - in MUST NOT be specified, it is implicitly in header.
 *    - All traits that are affected by the location MUST be applicable to a location of header (for example, style). This means that allowEmptyValue and allowReserved MUST NOT be used, and style, if used, MUST be limited to "simple".
 */
export const HeaderObjectSchemaDefinition = Type.Union([
  HeaderObjectWithSchemaSchema,
  compose(
    HeaderObjectSchemaBase,
    Type.Object({
      content: Type.Optional(Type.Record(Type.String(), MediaTypeObjectRef)),
    }),
  ),
])
