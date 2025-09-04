<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const isVisible = ref(false)
const placeholderRef = ref<HTMLDivElement>()

let observer: IntersectionObserver | undefined

onMounted(() => {
  // Create intersection observer to detect when placeholder enters viewport
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          isVisible.value = true
          // Disconnect observer once content is visible
          observer?.disconnect()
        }
      })
    },
    {
      // Trigger when placeholder is 10% visible
      threshold: 0.1,
      // Start observing before the element enters viewport
      rootMargin: '500px',
    },
  )

  // Start observing the placeholder element
  if (placeholderRef.value) {
    observer.observe(placeholderRef.value)
  }
})

onUnmounted(() => {
  // Clean up observer when component is destroyed
  if (observer) {
    observer.disconnect()
  }
})
</script>

<template>
  <slot v-if="isVisible"></slot>
  <div
    v-else
    ref="placeholderRef"
    class="placeholder"></div>
</template>

<style scoped>
.placeholder {
  height: 100%;
  width: 100%;
  min-height: 50px;
}
</style>
