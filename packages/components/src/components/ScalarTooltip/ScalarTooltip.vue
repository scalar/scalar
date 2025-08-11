<script lang="ts">
/**
 * Scalar tooltip component
 *
 * Adds a tooltip to an interactive element
 *
 * @example
 * <ScalarTooltip content="This is a tooltip">
 *   <ScalarButton>Hover Me</ScalarButton>
 * </ScalarTooltip>
 */
export default {}
</script>
<script setup lang="ts">
import { type Ref, computed, ref } from 'vue'

import { DEFAULT_DELAY, DEFAULT_OFFSET } from './constants'
import type { ScalarTooltipProps } from './types'
import { useTooltip } from './useTooltip'

const {
  delay = DEFAULT_DELAY,
  content = '',
  placement = 'top',
  offset = DEFAULT_OFFSET,
} = defineProps<ScalarTooltipProps>()

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
@reference "../../style.css";

/** Global styles for the tooltip */
:where(body) > .scalar-tooltip {
  --scalar-tooltip-padding: 8px;

  padding: calc(var(--scalar-tooltip-padding) + var(--scalar-tooltip-offset));

  @apply z-tooltip text-c-tooltip text-xs font-medium break-words max-w-xs leading-5;
}
:where(body) > .scalar-tooltip:before {
  content: '';
  inset: var(--scalar-tooltip-offset);
  @apply absolute rounded bg-b-tooltip -z-1 backdrop-blur;
}
:where(body.dark-mode) > .scalar-tooltip:before {
  @apply shadow-border;
}
</style>
