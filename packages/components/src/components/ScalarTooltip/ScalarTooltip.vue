<script setup lang="ts">
import type { Placement } from '@floating-ui/vue'
import { type Ref, computed, ref, useTemplateRef, watch } from 'vue'

import { useTooltip } from './useTooltip'

const {
  delay = 600,
  content = '',
  placement = 'top',
  offset = 4,
} = defineProps<{
  content?: string
  delay?: number
  placement?: Placement
  offset?: number
}>()

const wrapperRef: Ref<HTMLElement | null> = ref(null)

useTooltip({
  content: computed(() => content),
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
<style>
/** Global styles for the tooltip */
:where(body) > .scalar-tooltip {
  @apply z-tooltip rounded bg-b-tooltip text-c-tooltip p-2 text-xs font-medium break-words;
}
</style>
