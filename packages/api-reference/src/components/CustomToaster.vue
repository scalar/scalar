<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Toaster } from 'vue-sonner'

// The toaster is only required on the client
const isClientMounted = ref(false)
onMounted(() => (isClientMounted.value = true))
</script>

<template>
  <Toaster
    v-if="isClientMounted"
    :toastOptions="{ className: 'toaster' }" />
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
</style>
