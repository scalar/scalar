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
<style>
/**
 * A plain section is a surface lifted off the card. The header and footer are sections too, but
 * they sit on the card itself, so they are left out here with `:where()` to keep every selector at
 * a single class: a theme or `customCss` rule on `.scalar-card-content` still wins.
 */
.scalar-card-content:where(:not(.scalar-card-header, .scalar-card-footer)) {
  background: var(--scalar-card-surface);
  /* The card's corner less its padding, so the two curves stay concentric. */
  border-radius: var(--scalar-radius-xl);
  box-shadow: var(--scalar-card-surface-shadow);
}
/* Two surfaces in a row keep the card's padding between them. */
.scalar-card-content:where(:not(.scalar-card-header, .scalar-card-footer))
  + .scalar-card-content:where(:not(.scalar-card-header, .scalar-card-footer)) {
  margin-top: 4px;
}
/* A theme that paints the header or footer gets corners that follow the surface between them. */
:where(.scalar-card-header, .scalar-card-footer) {
  border-radius: var(--scalar-radius-xl);
}
</style>
