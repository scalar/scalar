<script lang="ts" setup>
/* eslint-disable vue/valid-template-root */
import { onBeforeUnmount, onMounted } from 'vue'

const emit = defineEmits<{
  (e: 'input', value: string): void
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

  if (
    target &&
    (target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable)
  ) {
    return
  }

  // Emit the clipboard text content
  if (event.clipboardData) {
    const pastedText = event.clipboardData.getData('text')

    if (pastedText) {
      emit('input', pastedText)
    }
  }
}
</script>

<template></template>
