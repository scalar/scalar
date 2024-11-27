<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue'

const hasError = ref<boolean>(false)
const error = ref<Error>()

onErrorCaptured((err, _, info) => {
  console.error('[ERROR]', err, info)

  hasError.value = true
  error.value = err

  // Prevent the error from propagating further up
  return false
})
</script>

<template>
  <slot v-if="!hasError" />
  <div
    v-else
    class="rounded border bg-b-2 p-3 text-sm">
    <div class="p-2">Oops, something went wrong here.</div>
    <div
      v-if="error"
      class="mt-2 rounded border bg-b-1 p-2 font-code text-c-2">
      {{ error?.name }}: {{ error?.message }}
    </div>
  </div>
</template>
