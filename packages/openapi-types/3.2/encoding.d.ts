import type { HeaderObject } from './header'
import type { ReferenceObject } from './reference'
/**
 * Encoding object
 *
 * A single encoding definition applied to a single value, with the mapping of Encoding Objects to values determined by the [Media Type Object](#media-type-object) as described under [Encoding Usage and Restrictions](#encoding-usage-and-restrictions).  See [Appendix B](#appendix-b-data-type-conversion) for a discussion of converting values of various types to string representations.  See [Appendix E](#appendix-e-percent-encoding-and-form-media-types) for a detailed examination of percent-encoding concerns for form media types.
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#encoding-object}
 */
export type EncodingObject = {
  /** The `Content-Type` for encoding a specific property. The value is a comma-separated list, each element of which is either a specific media type (e.g. `image/png`) or a wildcard media type (e.g. `image/*`). The default value depends on the type as shown in the table below. */
  contentType?: string
  /** A map allowing additional information to be provided as headers. `Content-Type` is described separately and SHALL be ignored in this section. This field SHALL be ignored if the media type is not a `multipart`. */
  headers?: Record<string, HeaderObject | ReferenceObject>
  /** Describes how a specific property value will be serialized depending on its type. See [Parameter Object](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#parameter-object) for details on the [`style`](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#parameter-style) field. The behavior follows the same values as `query` parameters, including the default value of `"form"` which applies only when `contentType` is _not_ being used due to one or both of `explode` or `allowReserved` being explicitly specified. Note that the initial `?` used in query strings is not used in `application/x-www-form-urlencoded` message bodies, and MUST be removed (if using an RFC6570 implementation) or simply not added (if constructing the string manually). This field SHALL be ignored if the media type is not `application/x-www-form-urlencoded` or `multipart/form-data`. If a value is explicitly defined, then the value of [`contentType`](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#encoding-content-type) (implicit or explicit) SHALL be ignored. */
  style?: 'form' | 'spaceDelimited' | 'pipeDelimited' | 'deepObject'
  /** When this is true, property values of type `array` or `object` generate separate parameters for each value of the array, or key-value-pair of the map. For other types of properties, or when [`style`](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#encoding-style) is `"deepObject"`, this field has no effect. When `style` is `"form"`, the default value is `true`. For all other styles, the default value is `false`. This field SHALL be ignored if the media type is not `application/x-www-form-urlencoded` or `multipart/form-data`. If a value is explicitly defined, then the value of [`contentType`](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#encoding-content-type) (implicit or explicit) SHALL be ignored. */
  explode?: boolean
  /** When this is true, parameter values are serialized using reserved expansion, as defined by [RFC6570](https://datatracker.ietf.org/doc/html/rfc6570#section-3.2.3), which allows [RFC3986's reserved character set](https://datatracker.ietf.org/doc/html/rfc3986#section-2.2), as well as percent-encoded triples, to pass through unchanged, while still percent-encoding all other disallowed characters (including `%` outside of percent-encoded triples). Applications are still responsible for percent-encoding reserved characters that are not allowed in the target media type; see [URL Percent-Encoding](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#url-percent-encoding) for details. The default value is `false`. This field SHALL be ignored if the media type is not `application/x-www-form-urlencoded` or `multipart/form-data`. If a value is explicitly defined, then the value of [`contentType`](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#encoding-content-type) (implicit or explicit) SHALL be ignored. */
  allowReserved?: boolean
  /** Applies nested Encoding Objects in the same manner as the [Media Type Object](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#media-type-object)'s `encoding` field. */
  encoding?: Record<string, EncodingObject>
  /** Applies nested Encoding Objects in the same manner as the [Media Type Object](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#media-type-object)'s `prefixEncoding` field. */
  prefixEncoding?: EncodingObject[]
  /** Applies nested Encoding Objects in the same manner as the [Media Type Object](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#media-type-object)'s `itemEncoding` field. */
  itemEncoding?: EncodingObject
} & Record<`x-${string}`, unknown>
