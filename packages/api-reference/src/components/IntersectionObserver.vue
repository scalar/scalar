<script setup lang="ts">
import { useApiClientStore } from '@scalar/api-client'
import { useIntersectionObserver } from '@vueuse/core'
import { onMounted, ref } from 'vue'

const props = defineProps<{
  id?: string
  is?: string
}>()

const emit = defineEmits<{
  (e: 'intersecting'): void
}>()

const { setSidebarIdVisibility } = useApiClientStore()
const intersectionObserverRef = ref<HTMLElement>()

onMounted(() => {
  useIntersectionObserver(
    intersectionObserverRef,
    ([{ isIntersecting }]) => {
      if (!props.id) {
        return
      }

      setSidebarIdVisibility(props.id, isIntersecting)

      if (isIntersecting) {
        emit('intersecting')
      }
    },
    {
      rootMargin: '0px 0px 50% 0px',
      threshold: 0.1,
    },
  )
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
