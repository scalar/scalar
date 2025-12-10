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
  /**
   * Create a new empty document in the workspace
   */
  'document:create:empty-document': {
    /** The name of the empty document to create */
    name: string
    /** The icon of the empty document to create */
    icon: string
    /** The callback to call when the document is created */
    callback?: (success: boolean) => void
  }
  /**
   * Delete a document from the workspace
   */
  'document:delete:document': {
    /** The name of the document to delete */
    name: string
  }
}
