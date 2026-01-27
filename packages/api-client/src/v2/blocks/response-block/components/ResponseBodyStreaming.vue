<script lang="ts" setup>
import {
  ScalarButton,
  ScalarLoading,
  useLoadingState,
} from '@scalar/components'
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

import { CollapsibleSection } from '@/v2/components/layout'

const { reader } = defineProps<{
  reader: ReadableStreamDefaultReader<Uint8Array>
}>()

const loader = useLoadingState()

const textContent = ref('')
const errorRef = ref<Error | null>(null)
const contentContainer = ref<HTMLElement | null>(null)

/** Track the current reader to prevent race conditions when reader changes */
const currentReader = ref<ReadableStreamDefaultReader<Uint8Array> | null>(null)

/** Current decoder instance - reset for each new stream to prevent buffer corruption */
const decoder = ref<TextDecoder | null>(null)

/**
 * Scrolls the content container to the bottom
 */
const scrollToBottom = () => {
  if (contentContainer.value) {
    contentContainer.value.scrollTop = contentContainer.value.scrollHeight
  }
}

// Watch for changes in textContent and scroll to bottom
watch(textContent, async () => {
  // Use nextTick to ensure the DOM has updated
  await nextTick(scrollToBottom)
})

/**
 * Reads the stream and appends the content
 */
async function readStream(
  streamReader: ReadableStreamDefaultReader<Uint8Array>,
) {
  try {
    while (loader.isLoading && currentReader.value === streamReader) {
      const { done, value } = await streamReader.read()

      // Stop if this reader is no longer the current one
      if (currentReader.value !== streamReader) {
        break
      }

      if (done) {
        void loader.clear()
        break
      }

      // Decode the Uint8Array to string and append to content
      if (value && decoder.value) {
        textContent.value += decoder.value.decode(value, { stream: true })
      }
    }
  } catch (error) {
    // Only handle the error if this is still the current reader
    if (currentReader.value === streamReader) {
      console.error('Error reading stream:', error)
      void loader.clear()
      errorRef.value = error as Error
    }
  } finally {
    // Only finalize decoding if this is still the current reader
    if (currentReader.value === streamReader && decoder.value) {
      // Make sure to decode any remaining bytes
      textContent.value += decoder.value.decode()
    }
  }
}

const startStreaming = () => {
  // Cancel the old reader if it exists
  if (currentReader.value) {
    currentReader.value.cancel()
  }

  // Set the new reader as current
  currentReader.value = reader

  // Reset state and start new stream
  // Create a new decoder instance to prevent buffer corruption from previous streams
  decoder.value = new TextDecoder()
  loader.start()
  textContent.value = ''
  errorRef.value = null
  void readStream(reader)
}

const stopStreaming = () => {
  if (currentReader.value) {
    currentReader.value.cancel()
    currentReader.value = null
  }
  void loader.clear()
}

// Start streaming when the reader changes
watch(() => reader, startStreaming, { immediate: true })

onBeforeUnmount(stopStreaming)
</script>

<template>
  <CollapsibleSection class="max-h-content overflow-y-hidden">
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
    <template
      v-if="loader.isLoading"
      #actions>
      <ScalarButton
        size="sm"
        variant="ghost"
        @click="stopStreaming">
        Cancel
      </ScalarButton>
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
  </CollapsibleSection>
</template>
