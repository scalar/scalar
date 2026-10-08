import type { MediaTypeObject } from './media-type.js'
import type { ReferenceObject } from './reference.js'
export type ContentObject = {
  [key: string]: MediaTypeObject | ReferenceObject
}
