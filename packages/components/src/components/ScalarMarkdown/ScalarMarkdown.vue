<script setup lang="ts">
import { htmlFromMarkdown } from '@scalar/code-highlight'
import '@scalar/code-highlight/css/markdown.css'
import { computed, onServerPrefetch } from 'vue'

import { sleep } from '../../helpers'

const props = withDefaults(
  defineProps<{
    value?: string
    withImages?: boolean
  }>(),
  {
    withImages: false,
  },
)

const html = computed(() =>
  htmlFromMarkdown(props.value ?? '', {
    removeTags: props.withImages ? [] : ['img', 'picture'],
  }),
)

// SSR hack - waits for the watch to complete
onServerPrefetch(async () => await sleep(1))
</script>

<template>
  <div
    class="markdown"
    v-html="html" />
</template>
