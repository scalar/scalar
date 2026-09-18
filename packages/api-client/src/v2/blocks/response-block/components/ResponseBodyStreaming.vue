<script lang="ts" setup>
import { ScalarButton } from '@scalar/components/button'
import { ScalarLoading, useLoadingState } from '@scalar/components/loading'
import { formatBytes } from '@scalar/helpers/formatters/format-bytes'
import { getUtf8ByteLength } from '@scalar/helpers/string/get-utf8-byte-length'
import { useClipboard } from '@scalar/use-hooks/useClipboard'
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

import { CollapsibleSection } from '@/v2/components/layout'

import { createResponseStreamParser } from '../helpers/response-stream'

const { reader, contentType = 'text/event-stream' } = defineProps<{
  reader: ReadableStreamDefaultReader<Uint8Array>
  contentType?: string
}>()

const loader = useLoadingState()
const textContent = ref('')
const receivedBytes = ref(0)
const { copyToClipboard } = useClipboard()
let downloadUrl: string | undefined

const clearDownload = (): void => {
  if (downloadUrl) {
    URL.revokeObjectURL(downloadUrl)
    downloadUrl = undefined
  }
}

/** Export only the bounded displayed transcript, without retaining another raw body. */
const downloadText = (): void => {
  clearDownload()
  downloadUrl = URL.createObjectURL(
    new Blob([textContent.value], { type: 'text/plain;charset=utf-8' }),
  )
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = 'response-stream.txt'
  link.click()
}
const errorRef = ref<Error | null>(null)
const contentContainer = ref<HTMLElement | null>(null)
let currentReader: ReadableStreamDefaultReader<Uint8Array> | null = null

/** Bound the text retained by a connection that can stay open indefinitely. */
const MAX_DISPLAY_SIZE = 16 * 1024 * 1024

watch(textContent, async () => {
  await nextTick()
  if (contentContainer.value) {
    contentContainer.value.scrollTop = contentContainer.value.scrollHeight
  }
})

const cancelReader = (
  streamReader: ReadableStreamDefaultReader<Uint8Array>,
): void => {
  void Promise.resolve(streamReader.cancel()).catch(() => {
    // A failed or disconnected stream can already be closed when the user cancels.
  })
}

const readStream = async (
  streamReader: ReadableStreamDefaultReader<Uint8Array>,
): Promise<void> => {
  try {
    let displayedBytes = 0
    const parser = createResponseStreamParser(contentType, (text) => {
      displayedBytes += getUtf8ByteLength(text)
      if (displayedBytes > MAX_DISPLAY_SIZE) {
        throw new Error(
          'Stream display reached its 16 MiB limit. Cancelled further reading.',
        )
      }
      textContent.value += text
    })
    while (currentReader === streamReader) {
      const { done, value } = await streamReader.read()
      if (currentReader !== streamReader) {
        return
      }
      if (done) {
        parser.finish()
        void loader.clear()
        return
      }
      receivedBytes.value += value.byteLength
      parser.push(value)
    }
  } catch (error) {
    if (currentReader === streamReader) {
      console.error('Error reading stream:', error)
      errorRef.value = error instanceof Error ? error : new Error(String(error))
      cancelReader(streamReader)
      void loader.clear()
    }
  } finally {
    streamReader.releaseLock()
  }
}

const stopStreaming = (): void => {
  const previous = currentReader
  currentReader = null
  if (previous) {
    cancelReader(previous)
  }
  void loader.clear()
}

const startStreaming = (): void => {
  stopStreaming()
  currentReader = reader
  loader.start()
  clearDownload()
  receivedBytes.value = 0
  textContent.value = ''
  errorRef.value = null
  void readStream(reader)
}

watch(() => reader, startStreaming, { immediate: true })
onBeforeUnmount(() => {
  stopStreaming()
  clearDownload()
})
</script>

<template>
  <CollapsibleSection class="max-h-content overflow-y-hidden">
    <template #title>
      <div class="flex w-full items-center justify-between">
        <div>
          Body
          <span class="text-c-2 ml-2 text-xs">
            {{ formatBytes(receivedBytes) }} received
          </span>
        </div>
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
    <template #actions>
      <ScalarButton
        v-if="loader.isLoading"
        size="sm"
        variant="ghost"
        @click="stopStreaming">
        Cancel
      </ScalarButton>
      <ScalarButton
        v-if="textContent"
        size="sm"
        variant="ghost"
        @click="copyToClipboard(textContent)">
        Copy text
      </ScalarButton>
      <ScalarButton
        v-if="textContent"
        size="sm"
        variant="ghost"
        @click="downloadText">
        Download text
      </ScalarButton>
    </template>

    <div
      ref="contentContainer"
      class="text-xxs font-code h-full overflow-auto leading-6 whitespace-pre-wrap">
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
