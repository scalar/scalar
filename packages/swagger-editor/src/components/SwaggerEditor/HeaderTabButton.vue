<template>
  <button
    class="swagger-editor-header-button"
    type="button">
    <slot />
  </button>
</template>
<style scoped>
.swagger-editor-header-button {
  font-family: var(--theme-font, var(--default-theme-font));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  border-radius: var(--theme-radius, var(--default-theme-radius))
    var(--theme-radius, var(--default-theme-radius)) 0 0;
  color: var(--theme-color-1, var(--default-theme-color-1));
  font-size: var(--theme-mini, var(--default-theme-mini));
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
  padding: 9px;
}
.swagger-editor-header-button:hover:after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: calc(100% - 6px);
  height: calc(100% - 6px);
  z-index: -1;
  border-radius: var(--theme-radius, var(--default-theme-radius));
  background: var(--theme-background-2, var(--default-theme-background-2));
}
</style>
