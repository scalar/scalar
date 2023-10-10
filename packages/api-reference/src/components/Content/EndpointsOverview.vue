<script setup lang="ts">
import { useApiClientStore } from '@scalar/api-client'
import { useIntersectionObserver } from '@vueuse/core'
import { nextTick, onMounted, ref } from 'vue'

import { useTemplateStore } from '../../stores/template'
import type { Operation, Tag } from '../../types'
import { Card, CardContent, CardHeader } from '../Card'
import MarkdownRenderer from './MarkdownRenderer.vue'

const props = defineProps<{ tag: Tag; index: number }>()

const { setCollapsedSidebarItem } = useTemplateStore()

const { setActiveSidebar } = useApiClientStore()

const scrollToEndpoint = async (item: Operation) => {
  setCollapsedSidebarItem(props.tag.name, true)
  document
    .getElementById(`endpoint/${item.httpVerb}-${item.operationId}`)
    ?.scrollIntoView()
  await nextTick()
  setActiveSidebar(`${item.httpVerb}-${item.operationId}`)
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
      <div class="editor-heading">
        <h1
          ref="tagHeader"
          class="heading">
          {{ tag.name }}
        </h1>
      </div>
      <div
        v-if="tag.description"
        class="tag-description">
        <MarkdownRenderer :value="tag.description" />
      </div>
    </div>
    <div
      v-if="tag.operations?.length > 0"
      class="example">
      <Card>
        <CardHeader muted>Endpoints</CardHeader>
        <CardContent muted>
          <div class="endpoints custom-scroll">
            <a
              v-for="child in tag.operations"
              :key="`${child.httpVerb}-${child.operationId}`"
              class="endpoint"
              @click="scrollToEndpoint(child)">
              <span :class="child.httpVerb">{{ child.httpVerb }}</span>
              <span>{{ child.path }}</span>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
<style scoped>
.endpoints {
  overflow: auto;
  background: var(--theme-background-2, var(--default-theme-background-2));
  padding: 10px 12px;
}
@media (max-width: 580px) {
  .endpoints {
    max-height: calc(100vh - 150px);
  }
}
.endpoints span + span {
  text-align: left;
  margin-left: 12px;
  text-transform: initial;
}
</style>
