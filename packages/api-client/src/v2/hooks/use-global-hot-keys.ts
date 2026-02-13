import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { type MaybeRefOrGetter, onBeforeUnmount, onMounted, toValue } from 'vue'

import { handleHotkeys } from '@/v2/helpers/handle-hotkeys'
import type { ClientLayout } from '@/v2/types/layout'

/**
 * Global hotkey handler for the app (web + desktop)
 *
 * @param eventBus - workspace event bus
 * @param layout - client layout
 * @param disableListeners - whether to disable the listeners
 */
export const useGlobalHotKeys = (
  eventBus: WorkspaceEventBus,
  layout: ClientLayout,
  disableListeners?: MaybeRefOrGetter<boolean>,
): void => {
  const handleKeyDown = (ev: KeyboardEvent) => {
    if (toValue(disableListeners)) {
      return
    }

    handleHotkeys(ev, eventBus, layout)
  }

  // Enable the listeners
  onMounted(() => window.addEventListener('keydown', handleKeyDown))
  onBeforeUnmount(() => window.removeEventListener('keydown', handleKeyDown))
}
