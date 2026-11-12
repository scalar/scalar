<script lang="ts">
/**
 * Scalar card component
 *
 * Creates an aria region using the nearest ScalarCardHeader as the label
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/region_role
 *
 * @example
 * <ScalarCard>
 *   <ScalarCardHeader>Header</ScalarCardHeader>
 *   <ScalarCardSection>Content</ScalarCardSection>
 *   <ScalarCardFooter>Footer</ScalarCardFooter>
 * </ScalarCard>
 */
export default {}
</script>
<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { computed } from 'vue'

import { useCardRegion } from './useCardHeading'

const { label } = defineProps<{
  /** The a11y label for the card region */
  label?: string
}>()

// Get the id for the nearest ScalarCardHeader if it exists
const { id } = useCardRegion()

const labelAttrs = computed(() => {
  if (label) {
    // If a label is provided, use it
    return { 'aria-label': label }
  }
  if (id.value) {
    // If no label is provided, use the heading id
    return { 'aria-labelledby': id.value }
  }
  // If no label or heading id is provided, don't add any aria attributes
  return {}
})

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <div
    role="group"
    v-bind="{
      ...labelAttrs,
      ...cx('scalar-card bg-b-2 flex flex-col rounded-2xl p-1'),
    }">
    <slot />
  </div>
</template>
<style>
/**
 * A card is a backdrop with its sections lifted off it as surfaces.
 *
 * The surface color is worked out from the backdrop instead of being read from another theme
 * token, so it stays one step lighter than the card whatever a theme does to the card's colors.
 * That lands on white over the default light backdrop and next to --scalar-background-3 over the
 * default dark one, and it keeps working for a theme that paints its cards dark in light mode,
 * where a token picked by color mode would be the wrong way round.
 *
 * A control that sits on a surface, such as a copy button, is one step further again. That step
 * goes toward the text color, so it is lighter than a dark surface and darker than a light one,
 * and never sinks back to the color of the card behind the surface.
 *
 * The variables are resolved here, on the card, so a section that swaps --scalar-background-2 for
 * its own purposes does not move the surface under the code inside it, and so a theme can set
 * --scalar-card-surface, --scalar-card-surface-raised or --scalar-card-surface-shadow on
 * `.scalar-card` without restating a section selector.
 *
 * Every rule below is a single class, so any theme or `customCss` rule that names the same
 * element still wins.
 */
.scalar-card {
  /* Browsers without relative colors get the light arrangement in both color modes. */
  --scalar-card-surface: var(--scalar-background-1);
  --scalar-card-surface-raised: var(--scalar-background-2);
  /* The theme's own soft shadow and border color, so a theme steers the outline of a surface */
  --scalar-card-surface-shadow:
    var(--scalar-shadow-1),
    0 0 0 var(--scalar-border-width) var(--scalar-border-color);
}
@supports (color: oklch(from white l c h)) {
  .scalar-card {
    --scalar-card-surface: oklch(
      from var(--scalar-background-2) calc(l + 0.055) c h
    );
    --scalar-card-surface-raised: color-mix(
      in oklab,
      var(--scalar-card-surface),
      var(--scalar-color-1) 8%
    );
  }
}
</style>
