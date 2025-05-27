<script lang="ts" setup>
import { ScalarIcon } from '@scalar/components'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const emit = defineEmits<{
  (e: 'input', value: string, integration: null, eventType: 'drop'): void
}>()

const isDragging = ref<boolean>(false)

let dragCounter = 0

// Register event listeners
onMounted(() => {
  document.addEventListener('dragenter', handleDragEnter)
  document.addEventListener('dragleave', handleDragLeave)
  document.addEventListener('dragover', handleDragOver)
  document.addEventListener('drop', handleDrop)
})

// Unregister event listeners
onBeforeUnmount(() => {
  document.removeEventListener('dragenter', handleDragEnter)
  document.removeEventListener('dragover', handleDragOver)
  document.removeEventListener('dragleave', handleDragLeave)
  document.removeEventListener('drop', handleDrop)
})

function isFromApp(event: DragEvent): boolean {
  return event.dataTransfer?.types.includes('text/html') ?? false
}

// Drop
async function handleDrop(event: DragEvent) {
  event.preventDefault()
  isDragging.value = false
  dragCounter = 0

  // Prevent emitting for text/html dragged items
  if (isFromApp(event)) {
    return
  }

  if (event.dataTransfer) {
    // Text
    const droppedText = event.dataTransfer.getData('text').replace(/^blob:/, '')

    if (droppedText) {
      emit('input', droppedText, null, 'drop')
    }
    // Files
    else if (event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0]
      if (!file) {
        return
      }

      const reader = new FileReader()

      reader.onload = async (e) => {
        if (e.target && typeof e.target.result === 'string') {
          emit('input', e.target.result, null, 'drop')
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

  // Prevent displaying the draggable UI for text/html dragged items
  if (isFromApp(event)) {
    return
  }

  if (event.dataTransfer) {
    const items = event.dataTransfer.items
    for (let i = 0; i < items.length; i++) {
      const item = items[i]

      if (
        item?.kind === 'string' ||
        item?.type?.includes('json') ||
        item?.type?.includes('yml') ||
        item?.type?.includes('yaml')
      ) {
        isDragging.value = true
        return
      }
    }
  }
  isDragging.value = false
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
      class="bg-b-2 fixed right-1/2 bottom-1/2 z-50 h-64 w-64 translate-x-1/2 translate-y-1/2 rounded-xl border transition-opacity duration-200 md:right-10 md:bottom-10 md:translate-x-0 md:translate-y-0">
      <div class="flex h-full flex-col items-center justify-center">
        <div>
          <ScalarIcon
            icon="Download"
            size="xl"
            thickness="2" />
        </div>
        <div class="text-c-1 m-4 text-center">
          Drop your OpenAPI document here
        </div>
      </div>
    </div>
  </transition>
</template>
