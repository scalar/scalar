<script setup lang="ts">
import { ref } from 'vue'

const el = ref<HTMLButtonElement>()

defineExpose({ el })
</script>
<template>
  <button
    ref="el"
    class="card-form-button"
    type="button">
    <slot />
  </button>
</template>
<style scoped>
:where(.card-form-button) {
  display: flex;
  align-items: center;
  position: relative;
  background: transparent;
  cursor: pointer;
  border-style: solid;
  border-width: 1px;
  border-color: inherit;
  padding: 9px !important;
  outline: none;
  white-space: nowrap;
  font-family: var(--theme-font, var(--default-theme-font));
  font-size: var(--theme-micro, var(--default-theme-micro));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  color: var(--theme-color-1, var(--default-theme-color-1));
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color)) !important;
}
.card-form-button:hover {
  background: var(--theme-background-2, var(--default-theme-background-2));
  border-color: var(--theme-border-color, var(--default-theme-border-color));
}
</style>
