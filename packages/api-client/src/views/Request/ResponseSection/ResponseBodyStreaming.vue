<script lang="ts" setup>
import { ScalarLoading, useLoadingState } from '@scalar/components'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'

const { reader } = defineProps<{
  reader: ReadableStreamDefaultReader<Uint8Array>
}>()

const loader = useLoadingState()

const textContent = ref('')
const errorRef = ref<Error | null>(null)
const decoder = new TextDecoder()
const contentContainer = ref<HTMLElement | null>(null)

/**
 * Scrolls the content container to the bottom
 */
const scrollToBottom = () => {
  if (contentContainer.value) {
    contentContainer.value.scrollTop = contentContainer.value.scrollHeight
  }
}

// Watch for changes in textContent and scroll to bottom
watch(textContent, () => {
  // Use nextTick to ensure the DOM has updated
  nextTick(scrollToBottom)
})

/**
 * Reads the stream and appends the content
 */
async function readStream() {
  try {
    while (loader.isLoading) {
      const { done, value } = await reader.read()

      if (done) {
        loader.stopLoading()
        break
      }

      // Decode the Uint8Array to string and append to content
      if (value) {
        textContent.value += decoder.decode(value, { stream: true })
      }
    }
  } catch (error) {
    console.error('Error reading stream:', error)
    loader.stopLoading()
    errorRef.value = error as Error
  } finally {
    // Make sure to decode any remaining bytes
    textContent.value += decoder.decode()
  }
}

onMounted(() => {
  loader.startLoading()
  readStream()
  errorRef.value = null
})

onBeforeUnmount(() => {
  reader.cancel()
  loader.stopLoading()
})
</script>

<template>
  <ViewLayoutCollapse class="max-h-content overflow-y-hidden">
    <template #title>
      <div class="flex w-full items-center justify-between">
        <div>Body</div>
        <div
          v-if="loader.isLoading"
          class="mr-2 flex items-center gap-2">
          <ScalarLoading
            :loadingState="loader"
            size="xs" />
          <span class="text-c-2"> Listening… </span>
        </div>
      </div>
    </template>

    <div
      ref="contentContainer"
      class="text-xxs font-code h-full overflow-auto leading-2 whitespace-pre-wrap">
      <template v-if="errorRef">
        <div class="text-red bg-b-danger sticky top-0 border-b p-2">
          {{ errorRef.message }}
        </div>
      </template>
      <template v-if="textContent">
        <div class="p-2">
          {{ textContent }}
        </div>
      </template>
    </div>
  </ViewLayoutCollapse>
</template>
