import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { onBeforeUnmount, onMounted } from 'vue'

import { handleHotkeyDown } from '@/v2/features/app/helpers/handle-hotkey-down'
import type { ClientLayout } from '@/v2/types/layout'

/**
 * Global hotkey handler for the app (web + desktop)
 *
 * @param eventBus - workspace event bus
 * @param layout - client layout
 */
export const useGlobalHotKeys = (eventBus: WorkspaceEventBus, layout: ClientLayout): void => {
  const handleKeyDown = (ev: KeyboardEvent) => handleHotkeyDown(ev, eventBus, layout)

  // Enable the listeners
  onMounted(() => window.addEventListener('keydown', handleKeyDown))
  onBeforeUnmount(() => window.removeEventListener('keydown', handleKeyDown))
}
