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

  padding: var(--scalar-tooltip-padding);

  @apply z-tooltip text-c-tooltip text-xs/4 font-medium break-words max-w-xs;
}

/**
 * The offset is the gap between the target and the tooltip, so it only belongs
 * on the side facing the target (opposite the placement side). Applying it to
 * every side shifts the visible box inward on `-start` / `-end` placements,
 * where Floating UI aligns the floating element's edge with the target's edge.
 */
:where(body) > .scalar-tooltip[data-side='top'] {
  padding-bottom: calc(
    var(--scalar-tooltip-padding) + var(--scalar-tooltip-offset)
  );
}
:where(body) > .scalar-tooltip[data-side='bottom'] {
  padding-top: calc(
    var(--scalar-tooltip-padding) + var(--scalar-tooltip-offset)
  );
}
:where(body) > .scalar-tooltip[data-side='left'] {
  padding-right: calc(
    var(--scalar-tooltip-padding) + var(--scalar-tooltip-offset)
  );
}
:where(body) > .scalar-tooltip[data-side='right'] {
  padding-left: calc(
    var(--scalar-tooltip-padding) + var(--scalar-tooltip-offset)
  );
}

:where(body) > .scalar-tooltip:before {
  content: '';
  inset: 0;
  @apply absolute rounded bg-b-tooltip -z-1 backdrop-blur;
}

/* Leave the gap on the target-facing side so the other edges stay flush */
:where(body) > .scalar-tooltip[data-side='top']:before {
  bottom: var(--scalar-tooltip-offset);
}
:where(body) > .scalar-tooltip[data-side='bottom']:before {
  top: var(--scalar-tooltip-offset);
}
:where(body) > .scalar-tooltip[data-side='left']:before {
  right: var(--scalar-tooltip-offset);
}
:where(body) > .scalar-tooltip[data-side='right']:before {
  left: var(--scalar-tooltip-offset);
}

:where(body.dark-mode) > .scalar-tooltip:before {
  @apply shadow-border;
}
</style>
