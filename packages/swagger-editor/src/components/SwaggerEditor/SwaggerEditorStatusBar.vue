<template>
  <div class="swagger-editor-status-bar"><slot /></div>
</template>

<style>
.swagger-editor-status-bar {
  color: var(--theme-color-3, var(--default-theme-color-3));
  padding: 6px 8px;
  font-size: var(--theme-font-size-5, var(--default-theme-font-size-5));
  background: var(--theme-background-3, var(--default-theme-background-3));
}
</style>
