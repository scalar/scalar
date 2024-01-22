import { type Ref, computed, onMounted, watch } from 'vue'

import { useActive } from './useActive'

/**
 * Add global or pseudo-global keyboard event handlers
 *
 * NOTES:
 * Event should be scoped as small as possibly. For example in a modal form the modal element should be
 * used as the reference element (not Document) because the handler will then be torn down with the element
 *
 * Handler prevents default. This may have unintended side effects.
 */
export function useKeyboardEvent({
  element,
  keyList,
  handler,
  type = 'keydown',
  withShift = false,
  withCtrlCmd = false,
  withAlt = false,
  ignoreInputElements = false,
  active = () => true,
}: {
  keyList: KeyboardEvent['key'][]
  withShift?: boolean
  withCtrlCmd?: boolean
  withAlt?: boolean
  element?: Ref<HTMLElement | null>
  handler: (e: KeyboardEvent) => void
  type?: 'keydown' | 'keyup'
  ignoreInputElements?: boolean
  active?: () => boolean
}) {
  /** Element or global event */
  const targetEl = computed(() => element?.value || 'document')
  const { isActive: componentIsActive } = useActive()

  const keys = keyList.map((k) => k.toLocaleLowerCase())

  const eventHandler = ((event: KeyboardEvent) => {
    const target = event.target as HTMLElement

    const isInput =
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
      target.contentEditable
    if (
      // Check if the component is active (e.g. in a `<keepalive>`)
      (componentIsActive.value &&
      // Check for command or ctrl keys
      withCtrlCmd
        ? event.ctrlKey || event.metaKey
        : !event.ctrlKey && !event.metaKey) &&
      // Check for shift key
      (withShift ? event.shiftKey : !event.shiftKey) &&
      // Check for alt key
      (withAlt ? event.altKey : !event.altKey) &&
      // Check whether or not to ignore inputs
      (!ignoreInputElements || !isInput) &&
      // Check for key match
      keys.includes(event.key.toLocaleLowerCase()) &&
      // Check if it’s currently active
      active()
    ) {
      event.preventDefault()
      handler(event)
    }
  }) as EventListener

  // Nested hook required to manage the undefined document in SSG build
  onMounted(() => {
    watch(
      targetEl,
      (value, prevValue) => {
        const prevTarget = prevValue === 'document' ? document : prevValue

        if (prevTarget) {
          prevTarget.removeEventListener(type, eventHandler)
        }

        const target = value === 'document' ? document : value
        if (target) {
          target.addEventListener(type, eventHandler)
        }
      },
      { immediate: true },
    )
  })

  const keyboardShortcut = {
    keyList,
    withShift,
    withCtrlCmd,
    withAlt,
  }

  return {
    keyboardShortcut,
  }
}
