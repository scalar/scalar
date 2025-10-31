import type { PartialDeep } from 'type-fest'

import type { InfoObject } from '@/schemas/v3.1/strict/info'

/** Event definitions for the openapi document */
export type DocumentEvents = {
  /**
   * Update any property in the document info object
   */
  'document:update:info': PartialDeep<InfoObject>
  /**
   * Update the icon of the active document/workspace
   */
  'document:update:icon': string
}
