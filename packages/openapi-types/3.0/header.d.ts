import type { ExampleObject } from './example'
import type { ExampleXorExamplesObject } from './example-xor-examples'
import type { MediaTypeObject } from './media-type'
import type { ReferenceObject } from './reference'
import type { SchemaObject } from './schema'
import type { SchemaXorContentObject } from './schema-xor-content'
/**
 * Header object
 *
 * Describes a single header for [HTTP responses](#response-headers) and for [individual parts in `multipart` representations](#encoding-headers); see the relevant [Response Object](#response-object) and [Encoding Object](#encoding-object) documentation for restrictions on which headers can be described.  The Header Object follows the structure of the [Parameter Object](#parameter-object), including determining its serialization strategy based on whether `schema` or `content` is present, with the following changes:  1. `name` MUST NOT be specified, it is given in the corresponding `headers` map. 1. `in` MUST NOT be specified, it is implicitly in `header`. 1. All traits that are affected by the location MUST be applicable to a location of `header` (for example, [`style`](#parameter-style)). This means that `allowEmptyValue` and `allowReserved` MUST NOT be used, and `style`, if used, MUST be limited to `"simple"`.
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#header-object}
 */
export type HeaderObject = {
  /** A brief description of the header. This could contain examples of use. [CommonMark syntax](https://spec.commonmark.org/) MAY be used for rich text representation. */
  description?: string
  /** Determines whether this header is mandatory. The default value is `false`. */
  required?: boolean
  /** Specifies that the header is deprecated and SHOULD be transitioned out of usage. Default value is `false`. */
  deprecated?: boolean
  allowEmptyValue?: boolean
  /** Describes how the header value will be serialized. The default (and only legal value for headers) is `"simple"`. */
  style?: 'simple'
  /** When this is true, header values of type `array` or `object` generate a single header whose value is a comma-separated list of the array items or key-value pairs of the map, see [Style Examples](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#style-examples). For other data types this field has no effect. The default value is `false`. */
  explode?: boolean
  allowReserved?: boolean
  /** The schema defining the type used for the header. */
  schema?: SchemaObject | ReferenceObject
  /** A map containing the representations for the header. The key is the media type and the value describes it. The map MUST only contain one entry. */
  content?: Record<string, MediaTypeObject>
  /** Example of the header's potential value; see [Working With Examples](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#working-with-examples). */
  example?: unknown
  /** Examples of the header's potential value; see [Working With Examples](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#working-with-examples). */
  examples?: Record<string, ExampleObject | ReferenceObject>
} & ExampleXorExamplesObject &
  SchemaXorContentObject
