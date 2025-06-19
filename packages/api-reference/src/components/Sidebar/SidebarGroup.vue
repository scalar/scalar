<script setup lang="ts">
defineProps<{
  level: number
}>()
</script>
<template>
  <ul
    class="sidebar-group sidebar-indent-nested"
    :style="{ '--scalar-sidebar-level': level }">
    <slot />
  </ul>
</template>
<style scoped>
.sidebar-group {
  list-style: none;
  width: 100%;
  margin: 0;
  padding: 0;
}

/* We indent each level of nesting further */
.sidebar-indent-nested :deep(.sidebar-heading) {
  /* prettier-ignore */
  padding-left: calc((var(--scalar-sidebar-level) * var(--scalar-sidebar-indent-base)) + 12px) !important;
}

/* Collapse/expand icons must also be offset */
.sidebar-indent-nested :deep(.sidebar-heading .toggle-nested-icon) {
  /* prettier-ignore */
  left: calc((var(--scalar-sidebar-level) * var(--scalar-sidebar-indent-base)) + 2px) !important;
}

/* Change font colors and weights for nested items */
/* Needs :where to lower specificity */
:where(.sidebar-indent-nested) :deep(.sidebar-heading) {
  color: var(--scalar-sidebar-color-1, var(--scalar-color-1));
}
:where(.sidebar-indent-nested)
  :deep(:where(.sidebar-indent-nested) .sidebar-heading) {
  color: var(--scalar-sidebar-color-2, var(--scalar-color-2));
}
</style>
