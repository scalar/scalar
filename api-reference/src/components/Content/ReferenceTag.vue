<script setup lang="ts">
import { useApiClientStore } from '@scalar/api-client'
import { useIntersectionObserver } from '@vueuse/core'
import { onMounted, ref } from 'vue'

import { EditorClasses } from '@guide/styles'

import { useTemplateStore } from '../../stores/template'
import type { Operation, Tag } from '../../types'
import MarkdownRenderer from './MarkdownRenderer.vue'

const props = defineProps<{ tag: Tag; index: number }>()

const { setCollapsedSidebarItem } = useTemplateStore()

const { setActiveSidebar } = useApiClientStore()

const scrollToEndpoint = (item: Operation) => {
  setActiveSidebar(item.operationId)
  document.getElementById(`endpoint/${item.operationId}`)?.scrollIntoView()
}

onMounted(() => {
  const root = document.getElementById('tippy')

  const tagHeader = ref<HTMLElement>()

  useIntersectionObserver(
    tagHeader,
    ([{ isIntersecting }]) => {
      if (isIntersecting) {
        if (props.index === 0) {
          const newUrl = `${window.location.origin}${window.location.pathname}`
          window.history.replaceState({}, '', newUrl)
          setCollapsedSidebarItem(props.tag.name, true)
        }
      }
    },
    {
      rootMargin: '0px 0px 0px 0px', // Trigger when the header touches the top of the viewport
      threshold: 0,
      root,
    },
  )
})
</script>

<template>
  <div
    :id="`tag/${tag.name}`"
    class="reference-container"
    :data-section-id="tag.name">
    <div class="copy">
      <div :class="EditorClasses.Heading">
        <h1
          ref="tagHeader"
          class="heading">
          {{ tag.name }}
        </h1>
      </div>
      <p class="tag-description">
        <MarkdownRenderer :value="tag.description" />
      </p>
    </div>
    <div class="example">
      <div class="tag-endpoints example-item">
        <span class="example-item-title">Endpoints</span>
        <div class="example-item-endpoints custom-scroll">
          <a
            v-for="child in tag.operations"
            :key="child.operationId"
            class="endpoint"
            @click="scrollToEndpoint(child)">
            <span :class="child.httpVerb">{{ child.httpVerb }}</span>
            <span>{{ child.path }}</span>
          </a>
        </div>
      </div>
    </div>
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
