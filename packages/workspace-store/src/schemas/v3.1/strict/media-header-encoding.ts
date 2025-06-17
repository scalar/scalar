import { encodingObjectSchemaBuilder } from '@/schemas/v3.1/strict/encoding'
import { headerObjectSchemaBuilder } from '@/schemas/v3.1/strict/header'
import { mediaTypeObjectSchemaBuilder } from '@/schemas/v3.1/strict/media-type'
import { Type, type Static } from '@sinclair/typebox'

/**
 * A single encoding definition applied to a single schema property. See Appendix B for a discussion of converting values of various types to string representations.
 *
 * Properties are correlated with multipart parts using the name parameter of Content-Disposition: form-data, and with application/x-www-form-urlencoded using the query string parameter names. In both cases, their order is implementation-defined.
 *
 * See Appendix E for a detailed examination of percent-encoding concerns for form media types.
 */
export const EncodingObjectSchema = Type.Recursive((This) =>
  encodingObjectSchemaBuilder(headerObjectSchemaBuilder(mediaTypeObjectSchemaBuilder(This))),
)

/**
 * Each Media Type Object provides schema and examples for the media type identified by its key.
 *
 * When example or examples are provided, the example SHOULD match the specified schema and be in the correct format as specified by the media type and its encoding. The example and examples fields are mutually exclusive, and if either is present it SHALL override any example in the schema. See Working With Examples for further guidance regarding the different ways of specifying examples, including non-JSON/YAML values.
 */
export const MediaTypeObjectSchema = Type.Recursive((This) =>
  mediaTypeObjectSchemaBuilder(encodingObjectSchemaBuilder(headerObjectSchemaBuilder(This))),
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
export const HeaderObjectSchema = Type.Recursive((This) =>
  headerObjectSchemaBuilder(mediaTypeObjectSchemaBuilder(encodingObjectSchemaBuilder(This))),
)

export type HeaderObject = Static<typeof HeaderObjectSchema>

export type MediaTypeObject = Static<typeof MediaTypeObjectSchema>

export type EncodingObject = Static<typeof EncodingObjectSchema>
