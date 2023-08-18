<script lang="ts" setup></script>
<template>
  <div class="code-editor-notification code-editor-notification--error">
    <slot />
  </div>
</template>
<style>
.code-editor-notification {
  color: var(--scalar-api-reference-theme-color-3);
  padding: 6px 8px;
  font-size: var(--scalar-api-reference-theme-font-size-5);
  border-top: var(--scalar-api-reference-border);
}

.code-editor-notification--error {
  background: var(--scalar-api-reference-theme-error-color);
  color: white;
}
</style>
