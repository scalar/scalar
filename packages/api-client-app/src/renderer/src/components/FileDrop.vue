<script lang="ts" setup>
import { onMounted, onUnmounted } from 'vue'

const drop = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()

  // Check if the user dropped an URL
  if (e.dataTransfer?.getData('text/uri-list')) {
    const url = e.dataTransfer.getData('text/uri-list')
    console.log('URL(s) you dragged here: ', url)
    return
  }

  // Check if the user dropped a file
  for (const f of e.dataTransfer?.files ?? []) {
    console.log('File(s) you dragged here: ', f.path)
  }
}

const dragover = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
}

onMounted(() => {
  document.addEventListener('drop', drop)
  document.addEventListener('dragover', dragover)
})

onUnmounted(() => {
  document.removeEventListener('drop', drop)
  document.removeEventListener('dragover', dragover)
})
</script>
<template>
  <slot />
</template>
