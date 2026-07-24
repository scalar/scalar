<script setup lang="ts">
const { tight, removeMargin = false } = defineProps<{
  tight?: boolean
  removeMargin?: boolean
}>()
</script>

<template>
  <!-- The reference is an embeddable widget, so the header collapses based on
       the rendered width of the reference (the narrow: variant), not the
       viewport. The section-header-wrapper class stays as a styling hook for
       SectionContainerAccordion. -->
  <div
    class="section-header-wrapper narrow:grid-cols-1 narrow:gap-0 grid grid-cols-2 gap-12">
    <div
      class="section-header"
      :class="{ tight, 'mb-3': !removeMargin }">
      <slot />
    </div>
    <slot
      v-if="$slots.links"
      name="links" />
  </div>
</template>

<style scoped>
.section-header {
  font-size: var(--font-size, var(--scalar-heading-1));
  font-weight: var(--font-weight, var(--scalar-bold));
  /* prettier-ignore */
  color: var(--scalar-color-1);
  word-wrap: break-word;
  line-height: 1.45;
  margin-top: 0;
}

.section-header.tight {
  margin-bottom: 6px;
}
</style>
