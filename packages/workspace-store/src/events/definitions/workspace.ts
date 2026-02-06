import type { ThemeId } from '@scalar/themes'
import type { AvailableClient } from '@scalar/types/snippetz'

import type { ColorMode } from '@/schemas/workspace'

/** Event definitions for the openapi document */
export type WorkspaceEvents = {
  /**
   * Update the active proxy
   */
  'workspace:update:active-proxy': string | null
  /**
   * Update the color mode of the workspace
   */
  'workspace:update:color-mode': ColorMode
  /**
   * Update the theme of the workspace
   */
  'workspace:update:theme': ThemeId
  /**
   * Update the selected client on the workspace
   */
  'workspace:update:selected-client': AvailableClient
  /**
   * Update the active environment on the workspace
   */
  'workspace:update:active-environment': string | null
}
