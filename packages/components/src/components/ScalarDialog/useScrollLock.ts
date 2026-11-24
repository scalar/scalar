import { onScopeDispose } from 'vue'

/** The inline styles a lock overrides, saved so the last release can put them back. */
type SavedStyles = {
  count: number
  overflow: string
  overflowPriority: string
  paddingRight: string
  paddingRightPriority: string
}

/**
 * Active locks, keyed by the root element they lock.
 *
 * Keyed per root rather than global because a dialog inside an iframe locks that iframe's own
 * document. A dialog in a shadow root shares its host's document, so it locks the page. The count lets nested and stacked dialogs share one lock, so closing the inner dialog
 * does not unlock the page while the outer one is still open.
 */
const locks = new WeakMap<HTMLElement, SavedStyles>()

/**
 * Lock scrolling on the document behind a modal.
 *
 * A native `<dialog>` makes the page inert but does not stop it scrolling, so a wheel or touch
 * gesture over the backdrop would scroll the content underneath. This sets `overflow: hidden` on
 * the document element and pads it by the scrollbar width, so the page does not shift sideways when
 * its scrollbar disappears. The lock is released automatically when the calling scope is disposed.
 *
 * @returns `lock` to take the lock for a given element's document and `unlock` to release it.
 * Both are idempotent, so calling either twice in a row is safe.
 */
export const useScrollLock = (): {
  lock: (element: Element) => void
  unlock: () => void
} => {
  /** The root this instance currently holds a lock on, if any. */
  let lockedRoot: HTMLElement | undefined

  const lock = (element: Element): void => {
    if (lockedRoot) {
      return
    }

    const root = element.ownerDocument.documentElement
    const view = element.ownerDocument.defaultView
    lockedRoot = root

    const existing = locks.get(root)
    if (existing) {
      existing.count++
      return
    }

    // Measure before hiding the overflow, since hiding it is what removes the scrollbar
    const scrollbarWidth = view ? view.innerWidth - root.clientWidth : 0
    const paddingRight = view ? Number.parseFloat(view.getComputedStyle(root).paddingRight) || 0 : 0

    locks.set(root, {
      count: 1,
      overflow: root.style.getPropertyValue('overflow'),
      overflowPriority: root.style.getPropertyPriority('overflow'),
      paddingRight: root.style.getPropertyValue('padding-right'),
      paddingRightPriority: root.style.getPropertyPriority('padding-right'),
    })

    root.style.setProperty('overflow', 'hidden')
    if (scrollbarWidth > 0) {
      root.style.setProperty('padding-right', `${paddingRight + scrollbarWidth}px`)
    }
  }

  const unlock = (): void => {
    const root = lockedRoot
    if (!root) {
      return
    }
    lockedRoot = undefined

    const saved = locks.get(root)
    if (!saved || --saved.count > 0) {
      return
    }
    locks.delete(root)

    restore(root, 'overflow', saved.overflow, saved.overflowPriority)
    restore(root, 'padding-right', saved.paddingRight, saved.paddingRightPriority)
  }

  onScopeDispose(unlock)

  return { lock, unlock }
}

/** Put an inline style back the way it was, removing it if it was not set before. */
const restore = (element: HTMLElement, property: string, value: string, priority: string): void => {
  if (value) {
    element.style.setProperty(property, value, priority)
  } else {
    element.style.removeProperty(property)
  }
}
