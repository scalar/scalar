<script setup lang="ts">
import { onMounted, onScopeDispose, ref } from 'vue'
import { toast, Toaster } from 'vue-sonner'
import baseStyles from 'vue-sonner/style.css?inline'

import { useToasts, type ToastOptions } from '../hooks/useToasts'
import styles from './legacy-toasts.css?inline'

// The toaster is only required on the client
const isClientMounted = ref(false)
let stylesheet: HTMLStyleElement | undefined
onMounted(() => {
  isClientMounted.value = true
  // The renderer is client-only, so its styles should not become hydration text nodes.
  stylesheet = document.createElement('style')
  stylesheet.dataset.scalarToastStyles = ''
  stylesheet.textContent = `${baseStyles}\n${styles}`
  document.head.appendChild(stylesheet)
})
onScopeDispose(() => stylesheet?.remove())

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
  <Toaster
    v-if="isClientMounted"
    class="scalar-toaster">
  </Toaster>
</template>
