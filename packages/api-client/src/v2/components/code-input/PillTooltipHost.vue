<script setup lang="ts">
import { useTooltip } from '@scalar/components'
import { computed, h, ref, render } from 'vue'

import type { PillContext } from './pill-context'

const props = defineProps<{
  context: PillContext
}>()

defineOptions({ name: 'PillTooltipHost' })

const wrapperRef = ref<HTMLElement | null>(null)
const isContextFn = props.context.type === 'contextFunction'

const contextTooltipHtml = computed(() => {
  if (!isContextFn || typeof document === 'undefined') {
    return ''
  }
  const el = document.createElement('div')
  render(
    h('div', { class: 'flex flex-col gap-1.5 text-left' }, [
      h('span', {}, props.context.details),
      h(
        'div',
        { class: 'text-[color:var(--scalar-color-3)] text-[10px] font-normal' },
        'Computed at request execution',
      ),
    ]),
    el,
  )
  return el.innerHTML
})

const environmentTooltipText = computed(() =>
  props.context.type === 'environment' ? props.context.value : '',
)

useTooltip({
  content: isContextFn ? contextTooltipHtml : environmentTooltipText,
  contentTarget: isContextFn ? 'innerHTML' : 'textContent',
  delay: 0,
  placement: 'bottom-start',
  offset: 6,
  targetRef: computed(
    () => wrapperRef.value?.children?.[0] || wrapperRef.value || undefined,
  ),
})
</script>

<template>
  <div
    ref="wrapperRef"
    class="contents">
    <div class="flex items-center gap-1 whitespace-nowrap">
      <span>{{
        props.context.type === 'environment'
          ? props.context.name
          : props.context.identifier
      }}</span>
    </div>
  </div>
</template>
