import { type Ref, readonly, ref } from 'vue'

/** The developer tools the localhost shell shows in its side panel, one at a time */
export type ShellPanel = 'configure' | 'share' | 'deploy' | 'sdk'

type OpenOptions = {
  /**
   * Move focus into the panel once it renders. For triggers far away from the panel in the Tab
   * order, so keyboard users land where it opened.
   */
  focus?: boolean
}

type CloseOptions = {
  /** Send focus back to whatever had it when the panel opened, for closing from inside the panel */
  restoreFocus?: boolean
}

type ShellPanelState = {
  /** The id of the panel element, for `aria-controls` on its triggers */
  id: string
  /** The open panel, if any */
  active: Readonly<Ref<ShellPanel | undefined>>
  /** Changes whenever an open asks for focus, and is undefined when it did not */
  focusRequest: Readonly<Ref<number | undefined>>
  open: (panel: ShellPanel, options?: OpenOptions) => void
  close: (options?: CloseOptions) => void
  /** Opens the panel, or closes it when it is the one already open */
  toggle: (panel: ShellPanel, options?: OpenOptions) => void
}

/**
 * State of the localhost shell's side panel, which shows one developer tool at a time beside the
 * card. The panel is not modal: the reference stays usable while it is open, so a configuration
 * change can be seen as it happens.
 *
 * @param id - The panel element's id, from `useId()` in the component that renders it
 */
export const useShellPanel = (id: string): ShellPanelState => {
  const active = ref<ShellPanel>()
  const focusRequest = ref<number>()

  /** Where focus goes back to when the panel closes from inside */
  let returnFocus: HTMLElement | undefined

  const open = (panel: ShellPanel, { focus = false }: OpenOptions = {}): void => {
    const current = typeof document === 'undefined' ? null : document.activeElement

    // Switching panels from inside the panel keeps the original trigger as the way back
    if (
      current instanceof HTMLElement &&
      current !== document.body &&
      !document.getElementById(id)?.contains(current)
    ) {
      returnFocus = current
    }

    active.value = panel
    focusRequest.value = focus ? (focusRequest.value ?? 0) + 1 : undefined
  }

  const close = ({ restoreFocus = false }: CloseOptions = {}): void => {
    const target = returnFocus

    active.value = undefined
    focusRequest.value = undefined
    returnFocus = undefined

    if (restoreFocus && target?.isConnected) {
      target.focus()
    }
  }

  const toggle = (panel: ShellPanel, options?: OpenOptions): void =>
    active.value === panel ? close() : open(panel, options)

  return {
    id,
    active: readonly(active),
    focusRequest: readonly(focusRequest),
    open,
    close,
    toggle,
  }
}
