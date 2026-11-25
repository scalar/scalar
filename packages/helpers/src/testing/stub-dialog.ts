/** Options for {@link stubDialogApi} */
type StubDialogOptions = {
  /**
   * Move focus to the first focusable element when a dialog opens, like a browser does
   *
   * @default false
   */
  focusFirst?: boolean
}

/** What a browser focuses first in a newly opened dialog, minus the finer points of the spec */
const FOCUSABLE = '[autofocus], a[href], button:not([disabled]), input, select, textarea'

/**
 * Stand in for the native dialog API in jsdom, which does not implement it
 *
 * `showModal()` marks the dialog open (and optionally focuses its first focusable element), and
 * `close()` unmarks it and dispatches `close`, as browsers do. The top layer, inertness and the
 * focus trap are not simulated; cover those with browser tests.
 *
 * @returns A function that restores whatever the prototype had before
 *
 * @example
 * let restoreDialogApi: () => void
 * beforeEach(() => (restoreDialogApi = stubDialogApi()))
 * afterEach(() => restoreDialogApi())
 */
export const stubDialogApi = ({ focusFirst = false }: StubDialogOptions = {}): (() => void) => {
  const prototype = HTMLDialogElement.prototype
  const originals = {
    showModal: Object.getOwnPropertyDescriptor(prototype, 'showModal'),
    close: Object.getOwnPropertyDescriptor(prototype, 'close'),
  }

  Object.defineProperties(prototype, {
    showModal: {
      configurable: true,
      value(this: HTMLDialogElement): void {
        this.setAttribute('open', '')
        if (focusFirst) {
          this.querySelector<HTMLElement>(FOCUSABLE)?.focus()
        }
      },
    },
    close: {
      configurable: true,
      value(this: HTMLDialogElement): void {
        this.removeAttribute('open')
        this.dispatchEvent(new Event('close'))
      },
    },
  })

  return (): void => {
    for (const [name, descriptor] of Object.entries(originals)) {
      if (descriptor) {
        Object.defineProperty(prototype, name, descriptor)
      } else {
        Reflect.deleteProperty(prototype, name)
      }
    }
  }
}
