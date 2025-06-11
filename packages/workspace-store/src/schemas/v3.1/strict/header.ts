import { Type, type Static } from '@sinclair/typebox'

/**
 * Describes a single header for HTTP responses and for individual parts in multipart representations; see the relevant Response Object and Encoding Object documentation for restrictions on which headers can be described.
 *
 * The Header Object follows the structure of the Parameter Object, including determining its serialization strategy based on whether schema or content is present, with the following changes:
 *
 *    - name MUST NOT be specified, it is given in the corresponding headers map.
 *    - in MUST NOT be specified, it is implicitly in header.
 *    - All traits that are affected by the location MUST be applicable to a location of header (for example, style). This means that allowEmptyValue and allowReserved MUST NOT be used, and style, if used, MUST be limited to "simple".
 */
export const HeaderObjectSchema = Type.Object({
  /** A brief description of the header. This could contain examples of use. CommonMark syntax MAY be used for rich text representation. */
  description: Type.Optional(Type.String()),
  /** Determines whether this header is mandatory. The default value is false. */
  required: Type.Optional(Type.Boolean()),
  /** Specifies that the header is deprecated and SHOULD be transitioned out of usage. Default value is false. */
  deprecated: Type.Optional(Type.Boolean()),
})

export type HeaderObject = Static<typeof HeaderObjectSchema>
