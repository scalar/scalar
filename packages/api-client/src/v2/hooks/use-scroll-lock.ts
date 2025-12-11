import { type MaybeRefOrGetter, computed, onBeforeUnmount, ref, toValue } from 'vue'

/**
 * useScrollLock - A Vue composition function to lock and unlock scrolling on a specific element.
 *
 * This hook provides a computed ref that allows you to enable or disable scrolling on a given HTMLElement.
 * Locking sets the element's `overflow` style to `'hidden'`.
 * Unlocking restores the original `overflow` value.
 *
 * The lock state will be automatically cleaned up (unlocked) when the component is unmounted.
 *
 * @param element - MaybeRefOrGetter for the HTMLElement to lock scrolling on. Can be a ref or a function.
 * @returns A computed ref: assign `true` to lock, `false` to unlock, read for current state.
 *
 * @example
 * ```ts
 * // In your setup():
 * const container = ref<HTMLElement | null>(null)
 * const scrollLock = useScrollLock(container)
 *
 * // To lock scrolling:
 * scrollLock.value = true
 *
 * // To unlock scrolling:
 * scrollLock.value = false
 * ```
 */
export const useScrollLock = (element: MaybeRefOrGetter<HTMLElement | null | undefined>) => {
  const initialValue = ref<string>('')
  const isLocked = ref(false)

  // Locks scrolling on the provided element and saves the initial overflow style
  const lock = () => {
    const el = toValue(element)

    if (!el) {
      return
    }

    // Save the initial overflow value
    initialValue.value = el.style.overflow
    el.style.overflow = 'hidden'
  }

  // Unlocks scrolling, restoring or removing the original overflow style
  const unlock = () => {
    const el = toValue(element)

    if (!el) {
      return
    }

    if (initialValue.value !== '') {
      el.style.overflow = initialValue.value
    } else {
      el.style.removeProperty('overflow')
    }
  }

  // Computed ref acting as a control interface for scroll lock
  const state = computed({
    get: () => isLocked.value,
    set: (value: boolean) => {
      isLocked.value = value
      value ? lock() : unlock()
    },
  })

  // Clean up when component is unmounted
  onBeforeUnmount(() => {
    if (isLocked.value) {
      unlock()
    }
  })

  return state
}
