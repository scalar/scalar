<script setup lang="ts">
defineProps<{
  level: number
}>()
</script>
<template>
  <ul
    class="sidebar-group sidebar-indent-nested"
    :style="{ '--sidebar-level': level }">
    <slot />
  </ul>
</template>
<style scoped>
.sidebar-group {
  list-style: none;
  width: 100%;
}

/* We indent each level of nesting further */
.sidebar-indent-nested :deep(.sidebar-heading) {
  /* prettier-ignore */
  padding-left: calc((var(--sidebar-level, var(--default-sidebar-level)) * var(--theme-sidebar-indent-base, var(--default-theme-sidebar-indent-base))) + 12px) !important;
}

/* Collapse/expand icons must also be offset */
.sidebar-indent-nested :deep(.sidebar-heading .toggle-nested-icon) {
  /* prettier-ignore */
  left: calc((var(--sidebar-level, var(--default-sidebar-level)) * var(--theme-sidebar-indent-base, var(--default-theme-sidebar-indent-base))) + 2px) !important;
}

/* Change font colors and weights for nested items */
/* Needs :where to lower specificity */
:where(.sidebar-indent-nested) :deep(.sidebar-heading) {
  /* prettier-ignore */
  color: var(--sidebar-color-1, var(--default-sidebar-color-1, var(--theme-color-1, var(--default-theme-color-1))));
}
:where(.sidebar-indent-nested)
  :deep(:where(.sidebar-indent-nested) .sidebar-heading) {
  /* prettier-ignore */
  color: var(--sidebar-color-2, var(--default-sidebar-color-2, var(--theme-color-2, var(--default-theme-color-2))));
}
</style>
