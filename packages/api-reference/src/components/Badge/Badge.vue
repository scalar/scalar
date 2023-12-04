<template>
  <div class="badge">
    <slot />
  </div>
</template>

<style scoped>
.badge {
  color: var(--theme-color-2, var(--default-theme-color-2));
  font-size: var(--theme-micro, var(--default-theme-micro));
  background: var(--theme-background-2, var(--default-theme-background-2));
  padding: 2px 6px;
  border-radius: 12px;
  margin-right: 4px;
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  margin-bottom: 3px;
  display: inline-block;
  text-transform: uppercase;
}
</style>
