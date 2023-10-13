<script setup lang="ts">
import { useApiClientStore } from '@scalar/api-client'
import { useIntersectionObserver } from '@vueuse/core'
import { onMounted, ref } from 'vue'

const props = defineProps<{
  id?: string
}>()

const { setActiveSidebar } = useApiClientStore()

const sectionRef = ref<HTMLElement>()

onMounted(() => {
  useIntersectionObserver(
    sectionRef,
    ([{ isIntersecting }]) => {
      if (!props.id) {
        return
      }

      if (isIntersecting) {
        const newUrl = `${window.location.origin}${window.location.pathname}#${props.id}`

        window.history.replaceState({}, '', newUrl)

        setActiveSidebar(props.id)
      }
    },
    {
      rootMargin: '0px 0px 50% 0px',
      threshold: 0,
    },
  )
})
</script>

<template>
  <section
    :id="id"
    ref="sectionRef"
    class="section">
    <slot />
  </section>
</template>

<style scoped>
.section {
  position: relative;
  display: flex;
  flex-direction: column;

  max-width: 1120px;
  margin: auto;
  padding: 90px 0;
}
.section:not(:last-of-type) {
  border-bottom: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}
</style>
