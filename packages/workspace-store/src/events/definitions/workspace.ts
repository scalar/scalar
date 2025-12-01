import type { ThemeId } from '@scalar/themes'

import type { XScalarTabs } from '@/schemas/extensions/workspace/x-sclar-tabs'
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
   * Update the tabs of the workspace
   */
  'workspace:update:tabs': XScalarTabs
}
