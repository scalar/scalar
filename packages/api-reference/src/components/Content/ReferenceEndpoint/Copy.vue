<script setup lang="ts">
import { useApiClientStore } from '@scalar/api-client'
import { type Operation, useOperation } from '@scalar/api-client'
import { useIntersectionObserver } from '@vueuse/core'
import { computed, onMounted, ref } from 'vue'

import { EditorClasses } from '@guide/styles'

import { useTemplateStore } from '../../../stores/template'
import type { Tag } from '../../../types'
import Parameters from './Parameters.vue'
import RequestBody from './RequestBody.vue'

const props = defineProps<{ operation: Operation; parentTag: Tag }>()

const { setActiveSidebar } = useApiClientStore()

const { parameterMap } = useOperation(props)

const { setCollapsedSidebarItem } = useTemplateStore()

const responseArray = computed(() => {
  const { responses } = props.operation.information

  const res: { name: string; description: string }[] = []

  Object.keys(responses).forEach((statusCode: string) => {
    res.push({
      name: statusCode,
      description: responses[statusCode].description,
    })
  })

  return res
})

const refHeader = ref<HTMLElement>()

onMounted(() => {
  const root = document.getElementById('tippy')

  useIntersectionObserver(
    refHeader,
    ([{ isIntersecting }]) => {
      if (isIntersecting) {
        const slug = props.operation.name.toLowerCase().split(' ').join('-')
        const newUrl = `${window.location.origin}${window.location.pathname}#${
          props.parentTag.name
        }/${encodeURI(slug)}`
        window.history.replaceState({}, '', newUrl)
        setActiveSidebar(props.operation.operationId)
        setCollapsedSidebarItem(props.parentTag.name, true)
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
  <div class="copy">
    <div :class="EditorClasses.Heading">
      <h1
        ref="refHeader"
        class="heading">
        {{ operation.name }}
      </h1>
    </div>
    <div :class="EditorClasses.Paragraph">
      <p class="tag-description">
        {{ operation.description }}
      </p>
    </div>
    <Parameters
      :parameters="parameterMap.path"
      title="Path Parameters" />
    <Parameters
      :parameters="parameterMap.query"
      title="Query Parameters" />
    <Parameters
      :parameters="parameterMap.header"
      title="Headers" />
    <RequestBody :requestBody="operation.information?.requestBody" />
    <Parameters
      :parameters="responseArray"
      title="Responses" />
  </div>
</template>
<style scoped>
.heading {
  margin-top: 0px !important;
}
.tag-description {
  margin-top: 12px;
}
</style>
