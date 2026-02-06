<script setup lang="ts">
import { ScalarCopy } from '@/components/ScalarCopy'
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { computed } from 'vue'

const { content } = defineProps<{
  /** Content to copy to clipboard */
  content: string | object
  /** Language of the code block */
  lang?: string
}>()

/** Handles the copy button click */
const contentToCopy = computed<string>(() => {
  return typeof content === 'string'
    ? content
    : JSON.stringify(content, null, 2)
})

const { stylingAttrsCx: cx, otherAttrs } = useBindCx()
</script>

<template>
  <div
    v-bind="
      cx(
        'scalar-code-copy opacity-0 group-hover/code-block:opacity-100 sticky flex inset-0 justify-end items-start bg-inherit',
      )
    ">
    <ScalarCopy
      class="group-hover/code-block:bg-b-2 group-focus-visible/code-block:bg-b-2"
      :content="contentToCopy"
      showLabel
      placement="left"
      v-bind="otherAttrs">
      <template
        v-if="lang"
        #copy>
        <span class="group-hover/copy-button:hidden">{{ lang }}</span>
        <span class="hidden group-hover/copy-button:inline">
          Copy to clipboard
        </span>
      </template>
    </ScalarCopy>
  </div>
</template>
