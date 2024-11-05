<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue'

const hasError = ref<boolean>(false)
const errorMessage = ref<string>('')

onErrorCaptured((err, _, info) => {
  console.error('[ERROR]', err, info)

  hasError.value = true
  errorMessage.value = err.message

  // Prevent the error from propagating further up
  return false
})
</script>

<template>
  <slot v-if="!hasError" />
  <div
    v-else
    class="m-4 rounded border bg-b-2 p-3 text-sm">
    <div class="p-2">Oops, something went wrong here.</div>
    <div
      v-if="errorMessage"
      class="mt-2 rounded border bg-b-1 p-2 font-code text-c-2">
      {{ errorMessage }}
    </div>
  </div>
</template>
