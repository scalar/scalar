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
}
.introduction-card-row {
  gap: 24px;
}
/* Classic layout */
@media (min-width: 600px) {
  .introduction-card-row {
    flex-flow: row wrap;
  }
}
.introduction-card-row > * {
  flex: 1;
}
@media (min-width: 600px) {
  .introduction-card-row > * {
    min-width: min-content;
  }
}
@media (max-width: 600px) {
  .introduction-card-row > * {
    max-width: 100%;
  }
}
@container (max-width: 900px) {
  .introduction-card-row {
    flex-direction: column;
    align-items: stretch;
    gap: 0px;
  }
}
.introduction-card :deep(.security-scheme-label) {
  text-transform: uppercase;
  font-weight: var(--scalar-semibold);
}
.introduction-card-row :deep(.scalar-card:nth-of-type(2) .scalar-card-header) {
  display: none;
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
