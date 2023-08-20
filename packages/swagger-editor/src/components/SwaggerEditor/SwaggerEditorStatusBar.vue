<template>
  <div class="code-editor-status-bar"><slot /></div>
</template>

<style>
.code-editor-status-bar {
  color: var(--theme-color-3);
  padding: 6px 8px;
  font-size: var(--scalar-api-reference-theme-font-size-5);
  border-top: 1px solid var(--theme-border-color);
}
</style>
