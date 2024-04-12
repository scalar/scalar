<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core'
import { onMounted, ref } from 'vue'

const props = defineProps<{
  id?: string
  is?: string
}>()

const emit = defineEmits<{
  (e: 'intersecting'): void
}>()

const intersectionObserverRef = ref<HTMLElement>()

const calculateRootMargin = (element: HTMLElement) => {
  const height = element.offsetHeight
  // Use of a margin on height to ensure sooner intersection detection.
  return `${height / 2}px 0px ${height / 2}px 0px`
}

const calculateThreshold = (element: HTMLElement) => {
  const height = element.offsetHeight
  // Favor larger threshold if the element is smaller that the screen
  // to ensure that it is selected
  return height < window.innerHeight ? 0.8 : 0.5
}

onMounted(() => {
  if (intersectionObserverRef.value) {
    const options = {
      rootMargin: calculateRootMargin(intersectionObserverRef.value),
      threshold: calculateThreshold(intersectionObserverRef.value),
    }

    useIntersectionObserver(
      intersectionObserverRef,
      ([{ isIntersecting }]) => {
        if (isIntersecting && props.id) {
          emit('intersecting')
        }
      },
      options,
    )
  }
})
</script>
<template>
  <component
    :is="is ?? 'div'"
    :id="id"
    ref="intersectionObserverRef">
    <slot />
  </component>
</template>
