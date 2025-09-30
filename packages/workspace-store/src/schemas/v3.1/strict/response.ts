import { Type } from '@scalar/typebox'

import type { HeaderObject } from '@/schemas/v3.1/strict/header'
import type { MediaTypeObject } from '@/schemas/v3.1/strict/media-type'

import type { LinkObject } from './link'
import { HeaderObjectRef, LinkObjectRef, MediaTypeObjectRef } from './ref-definitions'
import { type ReferenceType, reference } from './reference'

export const ResponseObjectSchemaDefinition = Type.Object({
  /** REQUIRED. A description of the response. CommonMark syntax MAY be used for rich text representation. */
  description: Type.String(),
  /** Maps a header name to its definition. RFC7230 states header names are case insensitive. If a response header is defined with the name "Content-Type", it SHALL be ignored. */
  headers: Type.Optional(Type.Record(Type.String(), Type.Union([HeaderObjectRef, reference(HeaderObjectRef)]))),
  /** A map containing descriptions of potential response payloads. The key is a media type or media type range and the value describes it. For responses that match multiple keys, only the most specific key is applicable. e.g. "text/plain" overrides "text/*"  */
  content: Type.Optional(Type.Record(Type.String(), MediaTypeObjectRef)),
  /** A map of operations links that can be followed from the response. The key of the map is a short name for the link, following the naming constraints of the names for Component Objects. */
  links: Type.Optional(Type.Record(Type.String(), Type.Union([LinkObjectRef, reference(LinkObjectRef)]))),
})

/**
 * Describes a single response from an API operation, including design-time, static links to operations based on the response.
 */
export type ResponseObject = {
  /** REQUIRED. A description of the response. CommonMark syntax MAY be used for rich text representation. */
  description: string
  /** Maps a header name to its definition. RFC7230 states header names are case insensitive. If a response header is defined with the name "Content-Type", it SHALL be ignored. */
  headers?: Record<string, ReferenceType<HeaderObject>>
  /** A map containing descriptions of potential response payloads. The key is a media type or media type range and the value describes it. For responses that match multiple keys, only the most specific key is applicable. e.g. "text/plain" overrides "text/*"  */
  content?: Record<string, MediaTypeObject>
  /** A map of operations links that can be followed from the response. The key of the map is a short name for the link, following the naming constraints of the names for Component Objects. */
  links?: Record<string, ReferenceType<LinkObject>>
}
