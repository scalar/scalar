import { useDocumentRoot } from '@scalar/use-hooks/useDocumentRoot'
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
  const root = useDocumentRoot()
  const isEmbedded = typeof ShadowRoot !== 'undefined' && root instanceof ShadowRoot
  const handleKeyDown = (ev: KeyboardEvent) => {
    const eventRoot = ev.composedPath().find((node) => node instanceof ShadowRoot)
    if (
      toValue(disableListeners) ||
      ev.defaultPrevented ||
      (isEmbedded ? eventRoot !== root : eventRoot !== undefined) ||
      // Escape belongs to the topmost native dialog, including nested dialogs.
      (isEmbedded && ev.key === 'Escape')
    ) {
      return
    }

    handleHotkeys(ev, eventBus, layout)
  }

  // Enable the listeners
  onMounted(() => window.addEventListener('keydown', handleKeyDown))
  onBeforeUnmount(() => window.removeEventListener('keydown', handleKeyDown))
}
