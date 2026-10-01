import type { NavigationEventBus } from '@scalar/workspace-store/events'
import { type MaybeRefOrGetter, onBeforeUnmount, onMounted, toValue } from 'vue'

import { type HotkeyNavigation, handleHotkeys } from '@/v2/helpers/handle-hotkeys'
import type { ClientLayout } from '@/v2/types/layout'

/**
 * Global hotkey handler for the app (web + desktop)
 *
 * @param eventBus - workspace event bus
 * @param layout - client layout
 * @param disableListeners - whether to disable the listeners
 */
export const useGlobalHotKeys = <L extends ClientLayout>(
  eventBus: NavigationEventBus<HotkeyNavigation<NoInfer<L>>>,
  layout: L,
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
