<script setup lang="ts">
import { onScopeDispose, ref } from 'vue'

import { useToasts, type ToastOptions } from '../hooks/useToasts'
import styles from './embedded-toasts.css?inline'
import ScalarEmbeddedToast from './ScalarEmbeddedToast.vue'

type Notification = {
  id: number
  message: string
  level: 'warn' | 'info' | 'error'
  options: ToastOptions
}

const notifications = ref<Notification[]>([])
let nextId = 0
const dismiss = (id: number): void => {
  notifications.value = notifications.value.filter(
    (notification) => notification.id !== id,
  )
}

onScopeDispose(
  useToasts().initializeToasts((message, level = 'info', options = {}) => {
    notifications.value.push({ id: nextId++, message, level, options })
  }),
)
</script>

<template>
  <component :is="'style'">{{ styles }}</component>
  <section
    aria-label="Notifications"
    aria-live="polite"
    aria-relevant="additions"
    class="scalar-embedded-toasts">
    <ScalarEmbeddedToast
      v-for="notification in notifications"
      :key="notification.id"
      :level="notification.level"
      :message="notification.message"
      :options="notification.options"
      @dismiss="dismiss(notification.id)" />
  </section>
</template>
