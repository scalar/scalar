<script lang="ts" setup></script>
<template>
  <div class="swagger-editor-notification swagger-editor-notification--error">
    <slot />
  </div>
</template>
<style>
.swagger-editor-notification {
  color: var(--theme-color-3, var(--default-theme-color-3));
  padding: 6px 12px;
  font-size: var(--theme-font-size-5, var(--default-theme-font-size-5));
}

.swagger-editor-notification--error {
  background: var(--theme-color-yellow, var(--default-theme-color-yellow));
  color: var(--theme-background-color-1, var(--default-theme-background-1));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
}
</style>
