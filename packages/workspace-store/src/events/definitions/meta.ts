import type { AvailableClients } from '@scalar/types/snippetz'

/** Event definitions for the workspace/document meta */
export type MetaEvents = {
  /**
   * Update the dark mode theme setting
   */
  'update:dark-mode': boolean
  /**
   * Update the active document on the workspace
   */
  'update:active-document': string
  /**
   * Update the selected client on the workspace
   */
  'update:selected-client': AvailableClients[number]
}
