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

/**
 * Tooltip styles apply in documents and shadow roots, including inside a native
 * dialog where the tooltip must live to paint above the browser's top layer.
 */
.scalar-tooltip {
  --scalar-tooltip-padding-x: 8px;
  --scalar-tooltip-padding-y: 6px;

  padding: var(--scalar-tooltip-padding-y) var(--scalar-tooltip-padding-x);

  @apply z-tooltip text-c-tooltip text-xs/4 font-normal break-words max-w-xs;
}

/**
 * The offset is the gap between the target and the tooltip, so it only belongs
 * on the side facing the target (opposite the placement side). Applying it to
 * every side shifts the visible box inward on `-start` / `-end` placements,
 * where Floating UI aligns the floating element's edge with the target's edge.
 */
.scalar-tooltip[data-side='top'] {
  padding-bottom: calc(
    var(--scalar-tooltip-padding-y) + var(--scalar-tooltip-offset)
  );
}
.scalar-tooltip[data-side='bottom'] {
  padding-top: calc(
    var(--scalar-tooltip-padding-y) + var(--scalar-tooltip-offset)
  );
}
.scalar-tooltip[data-side='left'] {
  padding-right: calc(
    var(--scalar-tooltip-padding-x) + var(--scalar-tooltip-offset)
  );
}
.scalar-tooltip[data-side='right'] {
  padding-left: calc(
    var(--scalar-tooltip-padding-x) + var(--scalar-tooltip-offset)
  );
}

/*
 * The hairline is spelled out: the preflight that gives `border` its theme colour only reaches
 * descendants of `.scalar-app`, and this element is the `.scalar-app` root itself, so the
 * utility alone would fall back to currentColor (black on light, white on dark).
 */
.scalar-tooltip:before {
  content: '';
  inset: 0;
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  @apply absolute rounded-lg bg-b-tooltip -z-1 backdrop-blur shadow;
}

/* Leave the gap on the target-facing side so the other edges stay flush */
.scalar-tooltip[data-side='top']:before {
  bottom: var(--scalar-tooltip-offset);
}
.scalar-tooltip[data-side='bottom']:before {
  top: var(--scalar-tooltip-offset);
}
.scalar-tooltip[data-side='left']:before {
  right: var(--scalar-tooltip-offset);
}
.scalar-tooltip[data-side='right']:before {
  left: var(--scalar-tooltip-offset);
}
</style>
