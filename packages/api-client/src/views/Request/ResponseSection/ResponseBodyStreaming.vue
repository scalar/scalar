<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'

const { reader } = defineProps<{
  reader: ReadableStreamDefaultReader<Uint8Array<ArrayBufferLike>>
}>()

const textContent = ref('')
const isReading = ref(true)
const decoder = new TextDecoder()

// Function to read the stream
async function readStream() {
  try {
    while (isReading.value) {
      const { done, value } = await reader.read()

      if (done) {
        isReading.value = false
        break
      }

      // Decode the Uint8Array to string and append to content
      if (value) {
        textContent.value += decoder.decode(value, { stream: true })
      }
    }
  } catch (error) {
    console.error('Error reading stream:', error)
    isReading.value = false
  } finally {
    // Make sure to decode any remaining bytes
    textContent.value += decoder.decode()
  }
}

onMounted(() => {
  readStream()
})

onBeforeUnmount(() => {
  isReading.value = false
  reader.cancel()
})
</script>

<template>
  <ViewLayoutCollapse class="max-h-content overflow-y-hidden">
    <template #title>
      Body ({{ isReading ? 'streaming...' : 'stream complete' }})
    </template>
    <div class="text-xxs font-code leading-2 whitespace-pre-wrap p-2">
      {{ textContent }}
    </div>
  </ViewLayoutCollapse>
</template>
