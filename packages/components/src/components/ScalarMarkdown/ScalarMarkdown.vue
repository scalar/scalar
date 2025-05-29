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
    withAnchors?: boolean
    anchorPrefix?: string
  }>(),
  {
    withImages: false,
    withAnchors: false,
  },
)

const transformHeading = (node: Record<string, any>) => {
  if (!props.withAnchors) {
    return props.transform?.(node) || node
  }

  const headingText = node.children?.[0]?.value || ''

  /** Basic slugify for the heading text */
  const slug = headingText.toLowerCase().replace(/\s+/g, '-')

  /** Return adding anchor prefix if present or just the slug */
  const id = props.anchorPrefix
    ? `${props.anchorPrefix}/description/${slug}`
    : slug

  // Add the id to the heading
  node.data = {
    hProperties: {
      id,
    },
  }

  if (props.transform) {
    return props.transform(node)
  }

  return node
}

const html = computed(() => {
  return htmlFromMarkdown(props.value ?? '', {
    removeTags: props.withImages ? [] : ['img', 'picture'],
    transform:
      props.withAnchors && props.transformType === 'heading'
        ? transformHeading
        : props.transform,
    transformType: props.transformType,
  })
})

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
