import { type Ref, computed, onMounted, watchEffect } from 'vue'

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
}: {
  keyList: KeyboardEvent['key'][]
  withShift?: boolean
  withCtrlCmd?: boolean
  withAlt?: boolean
  element?: Ref<HTMLElement | null>
  handler: (e: KeyboardEvent) => void
  type?: 'keydown' | 'keyup'
  ignoreInputElements?: boolean
}) {
  /** Element or global event */
  const targetEl = computed(() => element?.value || 'document')

  const keys = keyList.map((k) => k.toLocaleLowerCase())

  const eventHandler = ((event: KeyboardEvent) => {
    const target = event.target as HTMLElement

    const isInput =
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
      target.contentEditable
    if (
      // Check for command or ctrl keys
      (withCtrlCmd
        ? event.ctrlKey || event.metaKey
        : !event.ctrlKey && !event.metaKey) &&
      // Check for shift key
      (withShift ? event.shiftKey : !event.shiftKey) &&
      // Check for alt key
      (withAlt ? event.altKey : !event.altKey) &&
      // Check whether or not to ignore inputs
      (!ignoreInputElements || !isInput) &&
      // Check for key match
      keys.includes(event.key.toLocaleLowerCase())
    ) {
      event.preventDefault()
      handler(event)
    }
  }) as EventListener

  // Nested hook required to manage the undefined document in SSG build
  onMounted(() => {
    watchEffect(() => {
      const target = targetEl.value === 'document' ? document : targetEl.value

      target.removeEventListener(type, eventHandler)
      if (target) {
        target.addEventListener(type, eventHandler)
      }
    })
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
