import type { MediaTypeObject } from './media-type'
import type { ReferenceObject } from './reference'
import type { SchemaObject } from './schema'

/**
 * Constrains `schema` and `content` to be mutually exclusive.
 * The spec states Parameter Objects MUST include either a `content` field or a `schema` field, but not both.
 * When `content` is used, the serialization fields (`style`, `explode`, `allowReserved`) MUST NOT be used.
 */
export type SchemaXorContentObject =
  | { schema?: SchemaObject | ReferenceObject; content?: never }
  | { content?: Record<string, MediaTypeObject>; schema?: never; style?: never; explode?: never; allowReserved?: never }
