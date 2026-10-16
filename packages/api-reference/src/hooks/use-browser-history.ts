import { onBeforeMount, onScopeDispose } from 'vue'

const restorationOwners = new WeakMap<History, { count: number; previous: ScrollRestoration }>()

/** Restore host history behavior after the last reference leaves the page. */
export const useBrowserHistory = (onPopState: () => void): void => {
  let release: (() => void) | undefined

  onBeforeMount(() => {
    const history = window.history
    const owner = restorationOwners.get(history) ?? { count: 0, previous: history.scrollRestoration }
    if (owner.count === 0) {
      history.scrollRestoration = 'manual'
      restorationOwners.set(history, owner)
    }
    owner.count++
    window.addEventListener('popstate', onPopState)
    release = () => {
      window.removeEventListener('popstate', onPopState)
      owner.count--
      if (owner.count === 0) {
        // Respect a host that deliberately changed the setting while Scalar was mounted.
        if (history.scrollRestoration === 'manual') {
          history.scrollRestoration = owner.previous
        }
        restorationOwners.delete(history)
      }
    }
  })

  onScopeDispose(() => release?.())
}
