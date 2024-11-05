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
    class="border rounded m-4 p-3 bg-b-2 text-sm">
    <div class="p-2">Oops, something went wrong here.</div>
    <div
      v-if="errorMessage"
      class="font-code border rounded mt-2 p-2 text-c-2 bg-b-1">
      {{ errorMessage }}
    </div>
  </div>
</template>
