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
:where(.scalar-card-content:not(.scalar-card-header, .scalar-card-footer))
  + .scalar-card-content:where(:not(.scalar-card-header, .scalar-card-footer)) {
  margin-top: 4px;
}
/* A theme that paints the header or footer gets corners that follow the surface between them. */
:where(.scalar-card-header, .scalar-card-footer) {
  border-radius: var(--scalar-radius-xl);
}
/*
 * A header or footer has the card's padding on its outer side only, so on its own its contents sit
 * 2px off center, toward the surface beside it. Moving it toward the card's edge by half that
 * padding centers it between the two, and the opposite margin keeps the card's height.
 *
 * The shift assumes the card's default 4px padding, so it is keyed on ScalarCard's p-1 class. A card
 * given p-0 loses that class in the class merge and its header and footer stay put. A card that only
 * overrides its vertical padding (py-*, pt-*, pb-*, or p-* behind a breakpoint or important
 * modifier) keeps p-1 and still shifts, so give its header and footer margin-block: 0. A header or
 * footer that is the card's only child has padding on both sides and is already centered.
 */
:where(.scalar-card.p-1 > .scalar-card-header:first-child:not(:last-child)) {
  margin-block: -2px 2px;
}
:where(.scalar-card.p-1 > .scalar-card-footer:last-child:not(:first-child)) {
  margin-block: 2px -2px;
}
</style>
