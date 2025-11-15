import type { PartialDeep } from 'type-fest'

import type { InfoObject } from '@/schemas/v3.1/strict/info'

/** Event definitions for the openapi document */
export type DocumentEvents = {
  /**
   * Update any property in the document info object
   */
  'document:update:info': PartialDeep<InfoObject>
  /**
   * Update the icon of the active document
   */
  'document:update:icon': string
  /**
   * Toggle setting selected security schemes at the operation level
   */
  'document:toggle:security': undefined
  /**
   * Update the watch mode of the document
   *
   * Makes sense for the doucments that have been loaded from a remote source
   */
  'document:update:watch-mode': boolean
}
