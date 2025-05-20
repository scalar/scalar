<script setup lang="ts">
import { htmlFromMarkdown } from '@scalar/code-highlight'
import { cx } from '@scalar/use-hooks/useBindCx'
import { computed, onServerPrefetch } from 'vue'

const props = withDefaults(
  defineProps<{
    value?: string
    withImages?: boolean
    transform?: (node: Record<string, any>) => Record<string, any>
    transformType?: string
    clamp?: string | boolean
    class?: string
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
onServerPrefetch(async () => await new Promise((r) => setTimeout(r, 1)))
</script>
<template>
  <div
    :class="
      cx('markdown text-ellipsis', { 'line-clamp-4': clamp }, props.class)
    "
    :style="{
      '-webkit-line-clamp': typeof clamp === 'string' ? clamp : undefined,
    }"
    v-html="html" />
</template>
<style>
@import '@scalar/code-highlight/css/markdown.css';
</style>
