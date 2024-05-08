<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Toaster, toast } from 'vue-sonner'

import { type ToastOptions, useToasts } from '../hooks'

// The toaster is only required on the client
const isClientMounted = ref(false)
onMounted(() => (isClientMounted.value = true))

const toastMethods = {
  success: toast.success,
  error: toast.error,
  warn: toast.warning,
  info: toast,
}

const { initializeToasts } = useToasts()
initializeToasts((message, level = 'info', options: ToastOptions = {}) => {
  const toastAction = toastMethods[level] || toastMethods.info

  toastAction(message, {
    duration: options.timeout || 3000,
  })
})
</script>

<template>
  <Toaster
    v-if="isClientMounted"
    :toastOptions="{ className: 'toaster' }">
  </Toaster>
</template>

<style>
/**
* We need to be explicit to avoid !important. :)
*
* Original: https://github.com/xiaoluoboding/vue-sonner/blob/311ecc8d9a51b619f968e20f4b44992ad8412850/packages/styles.css#L91-L103
*/
.toaster[data-sonner-toast][data-styled='true'] {
  background: var(--scalar-background-1);
  color: var(--scalar-color-1);
  padding: 18px;
  border: none;
  border-radius: var(--scalar-radius-lg);
  font-size: var(--scalar-font-size-3);
  font-weight: var(--scalar-font-medium);
  box-shadow: var(--scalar-shadow-2);
}
.toaster[data-sonner-toast] [data-icon] {
  align-self: start;
}
.toaster[data-sonner-toast][data-styled='true'][data-expanded='true'] {
  height: auto;
}
.toaster[data-sonner-toast][data-type='error'] {
  background: var(--scalar-background-1);
}
.toaster[data-sonner-toast][data-type='error'] [data-icon] {
  color: color-mix(in srgb, var(--scalar-color-red) 75%, var(--scalar-color-1));
}
.toaster[data-sonner-toast][data-type='warning'] {
  background: var(--scalar-background-1);
}
.toaster[data-sonner-toast][data-type='warning'] [data-icon] {
  color: color-mix(
    in srgb,
    var(--scalar-color-orange) 90%,
    var(--scalar-color-1)
  );
}
</style>
