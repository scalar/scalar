import { Type, type TSchema } from '@sinclair/typebox'
import { ReferenceObjectSchema } from './reference'
import { ExtensionsSchema } from '@/schemas/v3.1/strict/extensions'
import { compose } from '@/schemas/v3.1/compose'

export const encodingObjectSchemaBuilder = <H extends TSchema>(header: H) =>
  compose(
    Type.Object({
      /** The Content-Type for encoding a specific property. The value is a comma-separated list, each element of which is either a specific media type (e.g. image/png) or a wildcard media type (e.g. image/*). Default value depends on the property type as shown in the table below. */
      contentType: Type.Optional(Type.String()),
      /** A map allowing additional information to be provided as headers. Content-Type is described separately and SHALL be ignored in this section. This field SHALL be ignored if the request body media type is not a multipart. */
      headers: Type.Optional(Type.Record(Type.String(), Type.Union([header, ReferenceObjectSchema]))),
    }),
    ExtensionsSchema,
  )
