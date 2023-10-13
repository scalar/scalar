<script setup lang="ts">
import { useApiClientStore } from '@scalar/api-client'
import { useIntersectionObserver } from '@vueuse/core'
import { onMounted, ref } from 'vue'

const props = defineProps<{
  id?: string
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
        const newUrl = `${window.location.origin}${window.location.pathname}#${props.id}`

        window.history.replaceState({}, '', newUrl)
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
  <div
    :id="id"
    ref="intersectionObserverRef"
    class="intersection-observer">
    <slot />
  </div>
</template>
