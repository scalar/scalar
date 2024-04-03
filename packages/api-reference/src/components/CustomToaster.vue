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
  background: var(--scalar-background-1);
  border-color: var(--scalar-background-3);
  border-radius: var(--scalar-radius-lg);
  font-size: var(--scalar-font-size-3);
  color: var(--scalar-color-1);
}
/* To remove jump on SSR */
ol[data-sonner-toaster] {
  margin: 0;
}
</style>
