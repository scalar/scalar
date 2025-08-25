<script lang="ts">
/**
 * Scalar hotkey tooltip component
 *
 * Adds a tooltip to an interactive element with a hotkey, if
 * you don't need to display a hotkey, use the ScalarTooltip
 * component instead
 *
 * @example
 * <ScalarHotkeyTooltip content="Bold" hotkey="B" modifier="Meta">
 *   <ScalarButton>Make bold</ScalarButton>
 * </ScalarHotkeyTooltip>
 */
export default {}
</script>
<script setup lang="ts">
import { type Ref, computed, h, ref, render } from 'vue'

import { ScalarHotkey } from '../ScalarHotkey'
import type { HotKeyModifier } from '../ScalarHotkey/types'
import { DEFAULT_DELAY, DEFAULT_OFFSET } from './constants'
import type { ScalarTooltipPlacement } from './types'
import { useTooltip } from './useTooltip'

const {
  delay = DEFAULT_DELAY,
  hotkey,
  modifier,
  content = '',
  placement = 'top',
  offset = DEFAULT_OFFSET,
} = defineProps<{
  content?: string
  hotkey: string
  modifier?: HotKeyModifier[]
  delay?: number
  placement?: ScalarTooltipPlacement
  offset?: number
}>()

const wrapperRef: Ref<HTMLElement | null> = ref(null)

/**
 * Render the content and the hotkey into an HTML string
 */
const renderedContent = computed<string>(() => {
  if (!document) return ''

  // Temp element to render the content into
  const el = document.createElement('div')

  const hotKeyClass =
    '-m-0.5 border-none p-0 grid grid-flow-col *:border *:h-5 *:min-w-5 *:border-border-tooltip *:rounded *:px-1 *:flex *:items-center *:justify-center'

  if (content) {
    // Render the content and the hotkey
    render(
      h('div', { class: 'flex items-center gap-2' }, [
        content,
        h(ScalarHotkey, {
          class: hotKeyClass,
          hotkey,
          modifier,
        }),
      ]),
      el,
    )
  } else {
    render(
      h(ScalarHotkey, {
        class: hotKeyClass,
        hotkey,
        modifier,
      }),
      el,
    )
  }

  const html = el.innerHTML

  // Return the rendered content
  return html
})

useTooltip({
  content: renderedContent,
  contentTarget: 'innerHTML',
  delay: computed(() => delay),
  placement: computed(() => placement),
  offset: computed(() => offset),
  targetRef: computed(
    () => wrapperRef.value?.children?.[0] || wrapperRef.value || undefined,
  ),
})
</script>
<template>
  <div
    ref="wrapperRef"
    :class="{ contents: !!$slots.default }">
    <slot />
  </div>
</template>
