<script setup lang="ts">
import {
  type Operation,
  useApiClientStore,
  useOperation,
} from '@scalar/api-client'
import { useIntersectionObserver } from '@vueuse/core'
import { computed, onMounted, ref } from 'vue'

// import { useTemplateStore } from '../../../stores/template'
// import type { Tag } from '../../../types'

const props = defineProps<{
  id?: string
}>()

// import MarkdownRenderer from '../MarkdownRenderer.vue'
// import Parameters from './Parameters.vue'
// import RequestBody from './RequestBody.vue'

// const props = defineProps<{ operation: Operation; parentTag: Tag }>()

const { setActiveSidebar } = useApiClientStore()

// const { parameterMap } = useOperation(props)

// const { setCollapsedSidebarItem } = useTemplateStore()

// const responseArray = computed(() => {
//   const { responses } = props.operation.information

//   const res: { name: string; description: string }[] = []

//   Object.keys(responses).forEach((statusCode: string) => {
//     res.push({
//       name: statusCode,
//       description: responses[statusCode].description,
//     })
//   })

//   return res
// })

const sectionRef = ref<HTMLElement>()

onMounted(() => {
  const root = document.getElementById('tippy')

  if (!props.id) {
    return
  }

  useIntersectionObserver(
    sectionRef,
    ([{ isIntersecting }]) => {
      if (isIntersecting) {
        console.log('isIntersecting', props.id)
        const newUrl = `${window.location.origin}${window.location.pathname}#${props.id}`
        window.history.replaceState({}, '', newUrl)
        setActiveSidebar(props.id)
        // setCollapsedSidebarItem(props.parentTag.name, true)
      }
    },
    {
      root,
      rootMargin: '0px 0px 0px 0px', // Trigger when the header touches the top of the viewport
      threshold: 0,
    },
  )
})
</script>

<template>
  SECTION ID: {{ id }}
  <section
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
