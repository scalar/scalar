<script setup lang="ts">
import { htmlFromMarkdown } from '@scalar/code-highlight'
import { computed, onServerPrefetch } from 'vue'

import { sleep } from '../../helpers/oas-utils'

const props = withDefaults(
  defineProps<{
    value?: string
    withImages?: boolean
    transform?: (node: Record<string, any>) => Record<string, any>
    transformType?: string
    isCollapsed?: boolean
  }>(),
  {
    withImages: false,
  },
)

const html = computed(() =>
  htmlFromMarkdown(props.value ?? '', {
    removeTags: props.withImages ? [] : ['img', 'picture'],
    transform: props.transform,
    transformType: props.transformType,
  }),
)

// SSR hack - waits for the watch to complete
onServerPrefetch(async () => await sleep(1))
</script>

<template>
  <div
    class="markdown"
    :class="{ collapsed: !isCollapsed }"
    v-html="html" />
</template>

<style>
@import '@scalar/code-highlight/css/markdown.css';
</style>
<style scoped>
.collapsed {
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 7;
  -webkit-box-orient: vertical;
}
</style>
