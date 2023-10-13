<script setup lang="ts">
withDefaults(defineProps<{ loading?: boolean }>(), {
  loading: false,
})

// import {
//   type Operation,
//   useApiClientStore,
//   useOperation,
// } from '@scalar/api-client'
// import { useIntersectionObserver } from '@vueuse/core'
// import { computed, onMounted, ref } from 'vue'

// import { useTemplateStore } from '../../../stores/template'
// import type { Tag } from '../../../types'
// import MarkdownRenderer from '../MarkdownRenderer.vue'
// import Parameters from './Parameters.vue'
// import RequestBody from './RequestBody.vue'

// const props = defineProps<{ operation: Operation; parentTag: Tag }>()

// const { setActiveSidebar } = useApiClientStore()

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

// const refHeader = ref<HTMLElement>()

// onMounted(() => {
//   const root = document.getElementById('tippy')

//   useIntersectionObserver(
//     refHeader,
//     ([{ isIntersecting }]) => {
//       if (isIntersecting) {
//         const slug = props.operation.name.toLowerCase().split(' ').join('-')
//         const newUrl = `${window.location.origin}${window.location.pathname}#${
//           props.parentTag.name
//         }/${encodeURI(slug)}`
//         window.history.replaceState({}, '', newUrl)
//         const { httpVerb, operationId } = props.operation
//         setActiveSidebar(`${httpVerb}-${operationId}`)
//         setCollapsedSidebarItem(props.parentTag.name, true)
//       }
//     },
//     {
//       root,
//       rootMargin: '0px 0px 0px 0px', // Trigger when the header touches the top of the viewport
//       threshold: 0,
//     },
//   )
// })
</script>

<template>
  <h1
    class="section-header"
    :class="{ loading }">
    <slot v-if="!loading" />
    <template v-else></template>
  </h1>
</template>

<style scoped>
.loading {
  background: var(--theme-background-3, var(--default-theme-background-3));
  animation: loading-skeleton 1.5s infinite alternate;
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
  min-height: 2em;
  margin: 0.6em 0;
  max-width: 80%;
}

@keyframes loading-skeleton {
  from {
    opacity: 1;
  }
  to {
    opacity: 0.33;
  }
}

.section-header {
  font-size: var(
    --font-size,
    var(
      --default-font-size,
      var(--theme-heading-2, var(--default-theme-heading-2))
    )
  );
  font-weight: var(
    --font-weight,
    var(--default-font-weight, var(--theme-bold, var(--default-theme-bold)))
  );
  /* prettier-ignore */
  color: var(--theme-color-1, var(--default-theme-color-1));
  word-wrap: break-word;
  line-height: 1.45;
  margin-top: 0;
}

.section-header.loading {
  width: 80%;
}
</style>
