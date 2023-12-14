<script setup lang="ts"></script>
<template>
  <button
    class="card-form-button"
    type="button">
    <slot />
  </button>
</template>
<style scoped>
:where(.card-form-button) {
  display: flex;
  position: relative;
  background: transparent;
  cursor: pointer;
  border-style: solid;
  border-width: 1px;
  border-color: inherit;
  padding: 9px;
  outline: none;
  font-size: var(--theme-micro, var(--default-theme-micro));
  font-weight: var(--theme-font-medium, var(--default-theme-font-medium));
  color: var(--theme-color-1, var(--default-theme-color-1));
}
.card-form-button:hover {
  background: var(--theme-background-2, var(--default-theme-background-2));
  border-color: var(--theme-border-color, var(--default-theme-border-color));
}
</style>
