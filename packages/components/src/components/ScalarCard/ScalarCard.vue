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
  <section
    v-bind="{
      ...labelAttrs,
      ...cx(
        'scalar-card bg-b-2 flex flex-col divide-y rounded-lg border *:first:rounded-t-[inherit] *:last:rounded-b-[inherit]',
      ),
    }">
    <slot />
  </section>
</template>
