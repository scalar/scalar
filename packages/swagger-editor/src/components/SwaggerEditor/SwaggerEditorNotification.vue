<script lang="ts" setup></script>
<template>
  <div class="swagger-editor-notification swagger-editor-notification--error">
    <slot />
  </div>
</template>
<style>
.swagger-editor-notification {
  color: var(--theme-color-3, var(--default-theme-color-3));
  padding: 6px 8px;
  font-size: var(--theme-font-size-5, var(--default-theme-font-size-5));
  border-top: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}

.swagger-editor-notification--error {
  background: var(--theme-error-color, var(--default-theme-color-red));
  color: white;
}
</style>
