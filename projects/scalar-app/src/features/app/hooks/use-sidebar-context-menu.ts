import { useModal } from '@scalar/components'
import type { SidebarState } from '@scalar/sidebar'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getParentEntry } from '@scalar/workspace-store/navigation'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import { computed, nextTick, ref } from 'vue'

/**
 * Anchor information for the currently open contextual dropdown. We hold on
 * to the DOM element that opened the menu so `SidebarItemMenu` can teleport
 * itself next to it, and track `showMenu` independently from `null`-ness so
 * closing the menu can play its exit animation before the target is cleared.
 */
type MenuTarget = {
  /** The sidebar entry the menu is acting on. */
  item: TraversedEntry
  /** The DOM element the dropdown is anchored to. */
  el: HTMLElement
  /** Whether the menu is currently rendered. */
  showMenu: boolean
}

/**
 * Owns the "more options" dropdown + delete confirmation modal for the app
 * sidebar.
 *
 * The hook exposes:
 *  - `menuTarget`: anchor + open state for the `SidebarItemMenu` component,
 *    so the dropdown can re-position itself next to the triggering icon
 *    button without each row rendering its own menu
 *  - `openMenu` / `closeMenu`: helpers that match the dropdown animation
 *    lifecycle (keep the target element around on close so exit animations
 *    can play)
 *  - `deleteModalState` + `deleteMessage`: the shared confirmation modal
 *    that is triggered from the dropdown menu. The message is phrased more
 *    strongly for documents because deleting one also removes every tag and
 *    operation inside it.
 *  - `handleDelete`: routes the confirmation to the right `*:delete:*`
 *    event on the workspace event bus depending on the item's type.
 */
export const useSidebarContextMenu = ({
  eventBus,
  sidebarState,
}: {
  eventBus: WorkspaceEventBus
  sidebarState: SidebarState<TraversedEntry>
}) => {
  const menuTarget = ref<MenuTarget | null>(null)
  const deleteModalState = useModal()

  const deleteMessage = computed(() => {
    const item = menuTarget.value?.item

    if (item?.type === 'document') {
      return "This cannot be undone. You're about to delete the document and all tags and operations inside it."
    }

    return `Are you sure you want to delete this ${item?.type ?? 'item'}? This action cannot be undone.`
  })

  /**
   * Open the dropdown for `item` and re-dispatch the originating event on
   * the anchor element after the next tick. Re-dispatching is what lets the
   * menu open on the correct anchor for both mouse and keyboard
   * interactions, matching the behaviour of the old sidebar.
   */
  const openMenu = async (event: MouseEvent | KeyboardEvent, item: TraversedEntry) => {
    if (menuTarget.value?.showMenu) {
      return
    }

    const el = event.currentTarget as HTMLElement
    menuTarget.value = { item, el, showMenu: true }

    await nextTick()

    const cloned =
      event instanceof MouseEvent ? new MouseEvent(event.type, event) : new KeyboardEvent(event.type, event)

    menuTarget.value?.el.dispatchEvent(cloned)
  }

  /**
   * Close the dropdown without resetting its target so exit animations can
   * still play out. The target is cleared on the next `handleDelete` or
   * `openMenu` call.
   */
  const closeMenu = () => {
    if (menuTarget.value) {
      menuTarget.value.showMenu = false
    }
  }

  /**
   * Fire the correct `*:delete:*` event on the workspace event bus for the
   * active menu target, then hide the confirmation modal and clear the
   * menu. Silent no-op if the target cannot be resolved to a parent
   * document (or parent operation, for examples).
   */
  const handleDelete = () => {
    const item = menuTarget.value?.item

    if (!item) {
      return
    }

    const result = sidebarState.getEntryById(item.id)
    const document = getParentEntry('document', result)
    const operation = getParentEntry('operation', result)

    if (!document) {
      return
    }

    if (item.type === 'document') {
      eventBus.emit('document:delete:document', { name: document.name })
    } else if (item.type === 'tag') {
      eventBus.emit('tag:delete:tag', {
        documentName: document.name,
        name: item.name,
      })
    } else if (item.type === 'operation') {
      eventBus.emit('operation:delete:operation', {
        meta: { method: item.method, path: item.path },
        documentName: document.name,
      })
    } else if (item.type === 'example') {
      if (!operation) {
        return
      }
      eventBus.emit('operation:delete:example', {
        meta: {
          method: operation.method,
          path: operation.path,
          exampleKey: item.name,
        },
        documentName: document.name,
      })
    }

    deleteModalState.hide()
    menuTarget.value = null
  }

  return {
    menuTarget,
    deleteModalState,
    deleteMessage,
    openMenu,
    closeMenu,
    handleDelete,
  }
}
