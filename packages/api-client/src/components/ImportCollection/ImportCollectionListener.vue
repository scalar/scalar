<script lang="ts" setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

import ImportCollectionModal from './ImportCollectionModal.vue'

// Keep the data
const input = ref<string | null>(null)
const title = ref<string | null>(null)

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

  // Drop event
  document.addEventListener('drop', handleDrop)
  document.addEventListener('dragover', handleDragOver)
})

// Unregister listeners
onBeforeUnmount(() => {
  document.removeEventListener('paste', handlePaste)
  document.removeEventListener('drop', handleDrop)
  document.removeEventListener('dragover', handleDragOver)
})

// Paste
async function handlePaste(event: ClipboardEvent) {
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

  if (event.dataTransfer) {
    // Text
    const droppedText = event.dataTransfer.getData('text')
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

// Reset the data when the modal was closed
function resetData() {
  title.value = null
  input.value = null
}

document.addEventListener('paste', handlePaste)
document.addEventListener('drop', handleDrop)
document.addEventListener('dragover', handleDragOver)
</script>

<template>
  <ImportCollectionModal
    :input="input"
    :title="title"
    @importFinished="resetData" />
  <slot />
</template>
