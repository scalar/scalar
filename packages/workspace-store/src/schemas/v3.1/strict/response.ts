import { Type, type Static } from '@sinclair/typebox'
import { ReferenceObjectSchema } from './reference'
import { LinkObjectSchema } from './link'
import { ExtensionsSchema } from '@/schemas/v3.1/strict/extensions'
import { compose } from '@/schemas/v3.1/compose'
import { HeaderObjectSchema, MediaTypeObjectSchema } from '@/schemas/v3.1/strict/media-header-encoding'

export const ResponseObjectSchema = compose(
  Type.Object({
    /** REQUIRED. A description of the response. CommonMark syntax MAY be used for rich text representation. */
    description: Type.String(),
    /** Maps a header name to its definition. RFC7230 states header names are case insensitive. If a response header is defined with the name "Content-Type", it SHALL be ignored. */
    headers: Type.Optional(Type.Record(Type.String(), Type.Union([HeaderObjectSchema, ReferenceObjectSchema]))),
    /** A map containing descriptions of potential response payloads. The key is a media type or media type range and the value describes it. For responses that match multiple keys, only the most specific key is applicable. e.g. "text/plain" overrides "text/*"  */
    content: Type.Optional(Type.Record(Type.String(), MediaTypeObjectSchema)),
    /** A map of operations links that can be followed from the response. The key of the map is a short name for the link, following the naming constraints of the names for Component Objects. */
    links: Type.Optional(Type.Record(Type.String(), Type.Union([LinkObjectSchema, ReferenceObjectSchema]))),
  }),
  ExtensionsSchema,
)

export type ResponseObject = Static<typeof ResponseObjectSchema>
