import tippy, {
  type Instance,
  type Props,
  followCursor,
  sticky,
} from 'tippy.js'
import { type Ref, onBeforeUnmount, ref, watch, watchEffect } from 'vue'

export type TooltipProps = Partial<Props>

export const useTippy = (
  triggerRef: Ref<HTMLElement | null>,
  contentRef: Ref<string | HTMLElement | null>,
  config?: TooltipProps,
): {
  onFocusChange: (handler: (isFocused: boolean) => void) => void
  setFocus: (isFocused: boolean) => void
  tip: Ref<Instance | null>
} => {
  const tip = ref<Instance | null>(null)
  const focused = ref(false)

  // Rebuild or destroy
  watch(
    [triggerRef, contentRef],
    async () => {
      // Cleanup tooltip before creation
      tip.value?.destroy?.()
      tip.value = null

      if (triggerRef.value && contentRef.value) {
        if (config?.followCursor) {
          tip.value = tippy(triggerRef.value, {
            placement: 'bottom-start',
            hideOnClick: false,
            followCursor: true,
            content: contentRef.value,
            animation: '',
            plugins: [followCursor],
            ...config,
          })
        } else {
          tip.value = tippy(triggerRef.value, {
            content: contentRef.value,
            sticky: true,
            animation: '',
            interactive: true,
            trigger: 'click',
            placement: 'bottom',
            hideOnClick: false,
            plugins: [sticky],
            onHide: () => {
              focused.value = false
            },
            onShow: () => {
              focused.value = true
            },
            onClickOutside() {
              tip.value?.hide()
            },
            ...config,
          })
        }
      }
    },
    { immediate: true },
  )

  // If the hook component is unmounted then destroy
  onBeforeUnmount(() => tip.value?.destroy())

  // Map the tooltip state to the focused state
  watchEffect(() => (focused.value ? tip.value?.show() : tip.value?.hide()))

  // Allow parent component to trigger actions when focus changes
  const focusChangeHandler = ref<(isFocused: boolean) => void>(() => null)
  watchEffect(() => focusChangeHandler.value(focused.value))

  return {
    onFocusChange: (handler: (isFocused: boolean) => void) => {
      focusChangeHandler.value = handler
    },
    setFocus: (isFocused: boolean) => {
      focused.value = isFocused
    },
    tip,
  }
}
