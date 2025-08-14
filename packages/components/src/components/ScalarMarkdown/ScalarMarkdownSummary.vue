<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { ref, useTemplateRef, watch } from 'vue'

import ScalarMarkdown from './ScalarMarkdown.vue'
import type { ScalarMarkdownProps } from './types'

const { clamp = 1, ...props } = defineProps<ScalarMarkdownProps>()

/** * Whether the summary is open. */
const open = defineModel<boolean>({ default: false })

const markdown = useTemplateRef('scalar-markdown')

/** Observer to check if the markdown is being truncated */
const observer = new ResizeObserver(checkTruncation)

/** Whether the markdown is being truncated */
const isTruncated = ref(false)

/** Check if the markdown is being truncated */
function checkTruncation() {
  const el = markdown.value?.el
  if (!el) {
    return
  }
  isTruncated.value =
    el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth
}

/** Watch the markdown template ref and observe the element */
watch(markdown, (templateRef) => {
  if (templateRef?.el) {
    observer.disconnect()
    observer.observe(templateRef.el)
    checkTruncation()
  }
})

const { cx } = useBindCx()
defineOptions({ inheritAttrs: false })
</script>
<template>
  <div
    v-bind="
      cx(
        'group/summary flex gap-0.5',
        open ? 'flex-col' : 'flex-row items-baseline',
      )
    ">
    <ScalarMarkdown
      ref="scalar-markdown"
      v-bind="props"
      :class="{ 'markdown-summary truncate': !open }"
      :clamp="open ? undefined : clamp" />
    <button
      v-if="isTruncated || open"
      class="whitespace-nowrap font-medium hover:underline"
      :class="{ 'self-end': open }"
      type="button"
      :aria-expanded="open"
      @click="open = !open">
      <slot
        name="button"
        :open="open">
        {{ open ? ' Close' : 'Read More' }}
      </slot>
    </button>
  </div>
</template>
<style>
.scalar-app {
  /*
    Summarized markdown styles
    Doubled up to bump specificity
  */
  .markdown.markdown-summary.markdown-summary {
    /* Hide the before and after pseudo-elements for all elements */
    *:before,
    *:after {
      content: none;
    }

    *:not(strong, em, a) {
      /* Disable formatting for non-inline elements */
      display: contents;
      font-size: inherit;
      font-weight: inherit;
      line-height: var(--markdown-line-height);
    }

    /* Hide elements that don't make sense in the summary */
    img,
    svg,
    hr,
    pre {
      display: none;
    }
  }
}
</style>
