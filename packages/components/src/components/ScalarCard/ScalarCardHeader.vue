<script lang="ts">
/**
 * Scalar card header component
 *
 * Will automatically be used as the aria-labelledby for the parent ScalarCard component
 *
 * @example
 * <ScalarCard>
 *   <ScalarCardHeader>Header</ScalarCardHeader>
 *   ...
 * </ScalarCard>
 */
export default {}
</script>
<script lang="ts" setup>
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { useId } from 'vue'

import ScalarCardSection from './ScalarCardSection.vue'
import { useCardHeading } from './useCardHeading'

/**
 * Scalar Card Header - Header section for cards with automatic accessibility setup
 */
defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()

// Get a unique id for the heading
const id = useId()

// Set the heading id for the card
useCardHeading(id)
</script>
<template>
  <ScalarCardSection
    v-bind="
      cx(
        'scalar-card-header leading-[22px] font-medium py-[6.75px] px-3 shrink-0',
      )
    ">
    <div
      :id="id"
      class="scalar-card-header-title min-w-0 flex-1 truncate">
      <slot />
    </div>
    <div
      v-if="$slots.actions"
      class="flex">
      <slot name="actions" />
    </div>
  </ScalarCardSection>
</template>
