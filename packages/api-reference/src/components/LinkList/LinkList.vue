<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const containerRef = ref<HTMLDivElement>()

/** Whether the container needs to scroll */
const needsScroll = ref(false)

/** Check if the container can scroll in either direction */
const checkScrollability = () => {
  if (!containerRef.value) {
    return
  }

  const { scrollWidth, clientWidth } = containerRef.value
  needsScroll.value = scrollWidth > clientWidth
}

/** MutationObserver to watch for changes in child elements */
let mutationObserver: MutationObserver | null = null

/**
 * We use the mutation observer to watch for changes and check if we need to scroll,
 * if we do need to scroll we apply the icons-only class to the container
 */
onMounted(() => {
  checkScrollability()

  // Re-check on window resize
  window.addEventListener('resize', checkScrollability)

  // Watch for changes in child elements
  if (containerRef.value) {
    mutationObserver = new MutationObserver(() => {
      checkScrollability()
    })

    mutationObserver.observe(containerRef.value, {
      childList: true,
      subtree: true,
    })
  }
})

onUnmounted(() => {
  // Clean up event listeners and observer
  window.removeEventListener('resize', checkScrollability)

  if (mutationObserver) {
    mutationObserver.disconnect()
    mutationObserver = null
  }
})
</script>

<template>
  <div
    ref="containerRef"
    :class="{ 'icons-only': needsScroll }"
    class="custom-scroll mb-3 flex h-auto min-h-8 max-w-full items-center gap-2 overflow-x-auto text-xs whitespace-nowrap xl:mb-1.5">
    <slot />
  </div>
</template>

<style scoped>
.icons-only :deep(span) {
  display: none;
}
</style>
