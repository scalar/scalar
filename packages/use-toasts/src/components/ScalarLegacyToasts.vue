<script setup lang="ts">
import { onMounted, onScopeDispose, ref } from 'vue'
import { toast, Toaster } from 'vue-sonner'

import { useToasts, type ToastOptions } from '../hooks/useToasts'
import styles from './legacy-toasts.css?inline'

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
onScopeDispose(
  initializeToasts((message, level = 'info', options: ToastOptions = {}) => {
    const toastAction = toastMethods[level] || toastMethods.info

    toastAction(message, {
      duration: options.timeout || 3000,
      description: options.description,
    })
  }),
)
</script>

<template>
  <component :is="'style'">{{ styles }}</component>
  <Toaster
    v-if="isClientMounted"
    class="scalar-toaster">
  </Toaster>
</template>
