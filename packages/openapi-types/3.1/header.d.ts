import type { ContentObject } from './content'
import type { ExampleObject } from './example'
import type { ReferenceObject } from './reference'
import type { SchemaObject } from './schema'

/**
 * Header object
 *
 * Describes a single header for [HTTP responses](#response-headers) and for [individual parts in `multipart` representations](#encoding-headers); see the relevant [Response Object](#response-object) and [Encoding Object](#encoding-object) documentation for restrictions on which headers can be described.  The Header Object follows the structure of the [Parameter Object](#parameter-object), including determining its serialization strategy based on whether `schema` or `content` is present, with the following changes:  1. `name` MUST NOT be specified, it is given in the corresponding `headers` map. 1. `in` MUST NOT be specified, it is implicitly in `header`. 1. All traits that are affected by the location MUST be applicable to a location of `header` (for example, [`style`](#parameter-style)). This means that `allowEmptyValue` and `allowReserved` MUST NOT be used, and `style`, if used, MUST be limited to `"simple"`.
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.2.md#header-object}
 */
type HeaderObjectBase = {
  /** A brief description of the header. This could contain examples of use. [CommonMark syntax](https://spec.commonmark.org/) MAY be used for rich text representation. */
  description?: string
  /** Determines whether this header is mandatory. The default value is `false`. */
  required?: boolean
  /** Specifies that the header is deprecated and SHOULD be transitioned out of usage. Default value is `false`. */
  deprecated?: boolean
} & Record<`x-${string}`, unknown>

export type HeaderWithSchemaObject = HeaderObjectBase & {
  /** The schema defining the type used for the header. */
  schema: SchemaObject
  /** Describes how the header value will be serialized. For headers, the only valid value is `"simple"`. */
  style?: 'simple'
  /** When this is true, header values of type `array` or `object` generate separate parameters for each value of the array or key-value pair of the map. Default value is `false`. */
  explode?: boolean
  /** Example of the header's potential value; see [Working With Examples](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.2.md#working-with-examples). */
  example?: unknown
  /** Examples of the header's potential value; see [Working With Examples](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.2.md#working-with-examples). */
  examples?: Record<string, ExampleObject | ReferenceObject>
}

export type HeaderWithContentObject = HeaderObjectBase & {
  /** A map containing the representations for the header. The key is the media type and the value describes it. The map MUST only contain one entry. */
  content: ContentObject
}

export type HeaderObject = HeaderWithSchemaObject | HeaderWithContentObject
