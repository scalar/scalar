<script setup lang="ts">
const { row } = defineProps<{
  row?: boolean
}>()
</script>

<template>
  <div
    class="introduction-card"
    :class="{ 'introduction-card-row': row }">
    <slot />
  </div>
</template>

<style scoped>
/* Modern layout */
.introduction-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.introduction-card-row {
  gap: 24px;
}
/*
 * Classic layout: a row of cards that stacks when the reference is narrow.
 * The reference is an embeddable widget, so the cards adapt to its rendered
 * width (see Content.vue), not to the viewport.
 */
.introduction-card-row {
  flex-flow: row wrap;
}
.introduction-card-row > * {
  flex: 1;
  min-width: min-content;
}
@container narrow-references-container (max-width: 900px) {
  .introduction-card-row {
    flex-direction: column;
    align-items: stretch;
    gap: 0;
  }
  .introduction-card-row > * {
    min-width: auto;
    max-width: 100%;
  }
}
.introduction-card :deep(.security-scheme-label) {
  text-transform: uppercase;
  font-weight: var(--scalar-semibold);
}
.introduction-card-row :deep(.scalar-card:nth-of-type(2) .scalar-card-header) {
  display: none;
}
.introduction-card-row
  :deep(
    .scalar-card:nth-of-type(2)
      .scalar-card-header.scalar-card--borderless
      + .scalar-card-content
  ) {
  margin-top: 0;
}
</style>
