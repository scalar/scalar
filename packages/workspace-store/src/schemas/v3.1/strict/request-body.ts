import { Type, type Static } from '@sinclair/typebox'
import { ExtensionsSchema } from '@/schemas/v3.1/strict/extensions'
import { compose } from '@/schemas/v3.1/compose'
import { MediaTypeObjectSchema } from '@/schemas/v3.1/strict/media-header-encoding'

/** Describes a single request body. */
export const RequestBodyObjectSchema = compose(
  Type.Object({
    /** A brief description of the request body. This could contain examples of use. CommonMark syntax MAY be used for rich text representation. */
    description: Type.Optional(Type.String()),
    /** REQUIRED. The content of the request body. The key is a media type or media type range and the value describes it. For requests that match multiple keys, only the most specific key is applicable. e.g. "text/plain" overrides "text/* */
    content: Type.Record(Type.String(), MediaTypeObjectSchema),
    /** Determines if the request body is required in the request. Defaults to false. */
    required: Type.Optional(Type.Boolean()),
  }),
  ExtensionsSchema,
)

export type RequestBodyObject = Static<typeof RequestBodyObjectSchema>
