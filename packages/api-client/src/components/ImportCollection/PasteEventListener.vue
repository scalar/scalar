<script lang="ts" setup>
/* eslint-disable vue/valid-template-root */
import { onBeforeUnmount, onMounted } from 'vue'

const emit = defineEmits<{
  (e: 'input', value: string, integration: null, eventType: 'paste'): void
}>()

// Register event listener
onMounted(() => {
  document.addEventListener('paste', handlePaste)
})

// Unregister event listener
onBeforeUnmount(() => {
  document.removeEventListener('paste', handlePaste)
})

// Handle the paste event
async function handlePaste(event: ClipboardEvent) {
  // Ignore paste events in input, textarea, or contenteditable elements
  const target = event.target as HTMLElement

  // Check if we're inside a CodeMirror instance
  const isCodeMirror = Boolean(
    document.activeElement?.classList.contains('cm-content'),
  )

  if (
    target &&
    (target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable ||
      isCodeMirror)
  ) {
    return
  }

  // Emit the clipboard text content
  if (event.clipboardData) {
    const pastedText = event.clipboardData.getData('text')

    if (pastedText) {
      emit('input', pastedText, null, 'paste')
    }
  }
}
</script>

<template></template>
