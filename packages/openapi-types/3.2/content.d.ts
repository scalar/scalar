import type { ReferenceObject } from './reference'
import type { MediaTypeObject } from './media-type'
export type ContentObject = {
  [key: string]: MediaTypeObject | ReferenceObject
}
