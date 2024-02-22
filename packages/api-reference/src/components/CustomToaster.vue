<script setup lang="ts">
import { Toaster } from 'vue-sonner'
</script>

<template>
  <Toaster :toastOptions="{ className: 'toaster' }" />
</template>

<style>
/**
* We need to be explicit to avoid !important. :)
*
* Original: https://github.com/xiaoluoboding/vue-sonner/blob/311ecc8d9a51b619f968e20f4b44992ad8412850/packages/styles.css#L91-L103
*/
.toaster[data-sonner-toast][data-styled='true'] {
  padding: 18px;
  background: var(--theme-background-1, var(--default-theme-background-1));
  border-color: var(--theme-background-3, var(--default-theme-background-3));
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
  font-size: var(--theme-font-size-3, var(--default-theme-font-size-3));
  color: var(--theme-color-1, var(--default-theme-color-1));
}
</style>
