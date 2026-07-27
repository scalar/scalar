import type { ReferenceObject } from './reference.js'
import type { MediaTypeObject } from './media-type.js'
export type ContentObject = {
  [key: string]: MediaTypeObject | ReferenceObject
}
