<script setup lang="ts">
import type { Placement } from '@floating-ui/vue'
import { type Ref, computed, ref } from 'vue'

import { useTooltip } from './useTooltip'

const {
  delay = 300,
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
<style>
/** Global styles for the tooltip */
:where(body) > .scalar-tooltip {
  --scalar-tooltip-padding: 8px;

  padding: calc(var(--scalar-tooltip-padding) + var(--scalar-tooltip-offset));

  @apply z-tooltip text-c-tooltip text-xs font-medium break-words max-w-xs leading-5;
}
:where(body) > .scalar-tooltip:before {
  content: '';
  inset: var(--scalar-tooltip-offset);
  @apply absolute rounded bg-b-tooltip -z-1;
}
</style>
