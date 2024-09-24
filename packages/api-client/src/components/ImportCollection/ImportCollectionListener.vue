<script lang="ts" setup>
import { ScalarIcon } from '@scalar/components'
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

import ImportCollectionModal from './ImportCollectionModal.vue'

// Keep the data
const input = ref<string | null>(null)
const title = ref<string | null>(null)

const isDragging = ref<boolean>(false)
let dragCounter = 0

// Register listeners
onMounted(() => {
  // Query parameters
  const queryParameters = new URLSearchParams(window.location.search)
  const urlQueryParameter = queryParameters.get('url')
  if (urlQueryParameter) {
    input.value = urlQueryParameter
  }

  const titleQueryParameter = queryParameters.get('title')
  if (titleQueryParameter) {
    title.value = titleQueryParameter
  }

  // Paste event
  document.addEventListener('paste', handlePaste)

  // Drag events
  document.addEventListener('dragenter', handleDragEnter)
  document.addEventListener('dragleave', handleDragLeave)
  document.addEventListener('dragover', handleDragOver)
  document.addEventListener('drop', handleDrop)
})

// Unregister listeners
onBeforeUnmount(() => {
  document.removeEventListener('paste', handlePaste)

  document.removeEventListener('dragenter', handleDragEnter)
  document.removeEventListener('dragover', handleDragOver)
  document.removeEventListener('dragleave', handleDragLeave)
  document.removeEventListener('drop', handleDrop)
})

// Paste
async function handlePaste(event: ClipboardEvent) {
  // Ignore paste events in input, textarea, or contenteditable elements
  const target = event.target as HTMLElement

  if (
    target &&
    (target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable)
  ) {
    return
  }

  if (event.clipboardData) {
    const pastedText = event.clipboardData.getData('text')
    if (pastedText) {
      // Reset, to trigger the modal to reopen
      input.value = null
      await nextTick()

      title.value = null
      input.value = pastedText
    }
  }
}

// Drop
async function handleDrop(event: DragEvent) {
  event.preventDefault()
  isDragging.value = false
  dragCounter = 0

  if (event.dataTransfer) {
    // Text
    const droppedText = event.dataTransfer.getData('text').replace(/^blob:/, '')

    if (droppedText) {
      // Reset, to trigger the modal to reopen
      input.value = null
      await nextTick()

      title.value = null
      input.value = droppedText
    }
    // Files
    else if (event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0]
      const reader = new FileReader()

      reader.onload = async (e) => {
        if (e.target && typeof e.target.result === 'string') {
          // Reset, to trigger the modal to reopen
          input.value = null
          await nextTick()

          title.value = null
          input.value = e.target.result
        }
      }
      reader.readAsText(file)
    }
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault()
  dragCounter--

  if (dragCounter === 0) {
    isDragging.value = false
  }
}

function handleDragEnter(event: DragEvent) {
  event.preventDefault()
  dragCounter++

  if (event.dataTransfer) {
    const items = event.dataTransfer.items
    for (let i = 0; i < items.length; i++) {
      const item = items[i]

      if (
        item.kind === 'string' ||
        item.type.includes('json') ||
        item.type.includes('yml') ||
        item.type.includes('yaml')
      ) {
        isDragging.value = true
        return
      }
    }
  }
  isDragging.value = false
}

// Reset the data when the modal was closed
function resetData() {
  title.value = null
  input.value = null
}
</script>

<template>
  <transition
    enterActiveClass="transition-opacity duration-200"
    enterFromClass="opacity-0"
    leaveActiveClass="transition-opacity duration-200"
    leaveToClass="opacity-0">
    <div
      v-if="isDragging"
      class="fixed bottom-10 right-10 w-64 h-64 bg-b-2 z-50 rounded border transition-opacity duration-200">
      <div class="flex flex-col items-center justify-center h-full">
        <div>
          <ScalarIcon
            icon="Download"
            size="md"
            thickness="1.75" />
        </div>
        <div class="text-center m-4 text-c-1">
          Drop your OpenAPI document here
        </div>
      </div>
    </div>
  </transition>
  <!-- Add this line -->
  <ImportCollectionModal
    :input="input"
    :title="title"
    @importFinished="resetData" />
  <slot />
</template>
