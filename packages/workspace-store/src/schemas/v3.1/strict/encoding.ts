import { Type } from '@scalar/typebox'

import type { HeaderObject } from './header'
import { HeaderObjectRef } from './ref-definitions'
import { type ReferenceType, reference } from './reference'

/**
 * A single encoding definition applied to a single schema property. See Appendix B for a discussion of converting values of various types to string representations.
 *
 * Properties are correlated with multipart parts using the name parameter of Content-Disposition: form-data, and with application/x-www-form-urlencoded using the query string parameter names. In both cases, their order is implementation-defined.
 *
 * See Appendix E for a detailed examination of percent-encoding concerns for form media types.
 */
export const EncodingObjectSchemaDefinition = Type.Object({
  /** The Content-Type for encoding a specific property. The value is a comma-separated list, each element of which is either a specific media type (e.g. image/png) or a wildcard media type (e.g. image/*). Default value depends on the property type as shown in the table below. */
  contentType: Type.Optional(Type.String()),
  /** A map allowing additional information to be provided as headers. Content-Type is described separately and SHALL be ignored in this section. This field SHALL be ignored if the request body media type is not a multipart. */
  headers: Type.Optional(Type.Record(Type.String(), Type.Union([HeaderObjectRef, reference(HeaderObjectRef)]))),
  /** Describes how a specific property value will be serialized depending on its type. See the Parameter Object for details on the style field. The behavior follows the same values as query parameters, including default values. Valid values are "form", "spaceDelimited", "pipeDelimited", and "deepObject". This field SHALL be ignored if the request body media type is not application/x-www-form-urlencoded or multipart/form-data. If a value is explicitly defined, then the value of contentType (implicit or explicit) SHALL be ignored. */
  style: Type.Optional(
    Type.Union([
      Type.Literal('form'),
      Type.Literal('spaceDelimited'),
      Type.Literal('pipeDelimited'),
      Type.Literal('deepObject'),
    ]),
  ),
  /** When this is true, property values of type array or object generate separate parameters for each value of the array, or key-value-pair of the map. For other types of properties this field has no effect. When style is "form", the default value is true. For all other styles, the default value is false. This field SHALL be ignored if the request body media type is not application/x-www-form-urlencoded or multipart/form-data. If a value is explicitly defined, then the value of contentType (implicit or explicit) SHALL be ignored. */
  explode: Type.Optional(Type.Boolean()),
  /** When this is true, parameter values are serialized using reserved expansion, as defined by RFC6570, which allows RFC3986's reserved character set, as well as percent-encoded triples, to pass through unchanged, while still percent-encoding all other disallowed characters (including % outside of percent-encoded triples). The default value is false. This field SHALL be ignored if the request body media type is not application/x-www-form-urlencoded or multipart/form-data. If a value is explicitly defined, then the value of contentType (implicit or explicit) SHALL be ignored. */
  allowReserved: Type.Optional(Type.Boolean()),
})

/**
 * A single encoding definition applied to a single schema property. See Appendix B for a discussion of converting values of various types to string representations.
 *
 * Properties are correlated with multipart parts using the name parameter of Content-Disposition: form-data, and with application/x-www-form-urlencoded using the query string parameter names. In both cases, their order is implementation-defined.
 *
 * See Appendix E for a detailed examination of percent-encoding concerns for form media types.
 */
export type EncodingObject = {
  /** The Content-Type for encoding a specific property. The value is a comma-separated list, each element of which is either a specific media type (e.g. image/png) or a wildcard media type (e.g. image/*). Default value depends on the property type as shown in the table below. */
  contentType?: string
  /** A map allowing additional information to be provided as headers. Content-Type is described separately and SHALL be ignored in this section. This field SHALL be ignored if the request body media type is not a multipart. */
  headers?: Record<string, ReferenceType<HeaderObject>>
  /** Describes how a specific property value will be serialized depending on its type. See the Parameter Object for details on the style field. The behavior follows the same values as query parameters, including default values. Valid values are "form", "spaceDelimited", "pipeDelimited", and "deepObject". This field SHALL be ignored if the request body media type is not application/x-www-form-urlencoded or multipart/form-data. If a value is explicitly defined, then the value of contentType (implicit or explicit) SHALL be ignored. */
  style?: 'form' | 'spaceDelimited' | 'pipeDelimited' | 'deepObject' | undefined
  /** When this is true, property values of type array or object generate separate parameters for each value of the array, or key-value-pair of the map. For other types of properties this field has no effect. When style is "form", the default value is true. For all other styles, the default value is false. This field SHALL be ignored if the request body media type is not application/x-www-form-urlencoded or multipart/form-data. If a value is explicitly defined, then the value of contentType (implicit or explicit) SHALL be ignored. */
  explode?: boolean
  /** When this is true, parameter values are serialized using reserved expansion, as defined by RFC6570, which allows RFC3986's reserved character set, as well as percent-encoded triples, to pass through unchanged, while still percent-encoding all other disallowed characters (including % outside of percent-encoded triples). The default value is false. This field SHALL be ignored if the request body media type is not application/x-www-form-urlencoded or multipart/form-data. If a value is explicitly defined, then the value of contentType (implicit or explicit) SHALL be ignored. */
  allowReserved?: boolean
}
