<script setup lang="ts">
import { onMounted, onScopeDispose } from 'vue'

import type { ToastOptions } from '../hooks/useToasts'

const { message, level, options } = defineProps<{
  message: string
  level: 'warn' | 'info' | 'error'
  options: ToastOptions
}>()
const emit = defineEmits<{ dismiss: [] }>()

let timer: ReturnType<typeof setTimeout> | undefined
let remaining = options.timeout || 3000
let startedAt = 0
const pauses = new Set<'pointer' | 'focus'>()
const stop = (): void => {
  clearTimeout(timer)
  timer = undefined
}
const resume = (): void => {
  if (pauses.size || timer !== undefined || !Number.isFinite(remaining)) {
    return
  }
  startedAt = Date.now()
  timer = setTimeout(() => emit('dismiss'), Math.max(0, remaining))
}
const pause = (reason: 'pointer' | 'focus'): void => {
  if (timer !== undefined) {
    remaining -= Date.now() - startedAt
    stop()
  }
  pauses.add(reason)
}
const unpause = (reason: 'pointer' | 'focus'): void => {
  pauses.delete(reason)
  resume()
}

onMounted(resume)
onScopeDispose(stop)
</script>

<template>
  <div
    class="scalar-embedded-toast"
    :data-level="level"
    :role="level === 'error' ? 'alert' : 'status'"
    @focusin="pause('focus')"
    @focusout="unpause('focus')"
    @pointerenter="pause('pointer')"
    @pointerleave="unpause('pointer')">
    <div>
      <div class="scalar-embedded-toast-title">{{ message }}</div>
      <div
        v-if="options.description"
        class="scalar-embedded-toast-description">
        {{ options.description }}
      </div>
    </div>
    <button
      aria-label="Dismiss notification"
      type="button"
      @click="emit('dismiss')">
      ×
    </button>
  </div>
</template>
