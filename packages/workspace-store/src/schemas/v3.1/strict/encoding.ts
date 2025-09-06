import { Type } from '@scalar/typebox'

import { HeaderObjectRef } from '@/schemas/v3.1/strict/ref-definitions'

import { reference } from './reference'

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
})
