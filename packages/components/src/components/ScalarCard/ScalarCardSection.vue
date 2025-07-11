<script lang="ts">
/**
 * Scalar card section component
 *
 * A generic section of a ScalarCard component, provides the base for ScalarCardHeader and ScalarCardFooter
 *
 * @example
 * <ScalarCard>
 *   ...
 *   <ScalarCardSection>Content</ScalarCardSection>
 *   ...
 * </ScalarCard>
 */
export default {}
</script>
<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <div v-bind="cx('scalar-card-content flex overflow-auto')">
    <slot />
  </div>
</template>
