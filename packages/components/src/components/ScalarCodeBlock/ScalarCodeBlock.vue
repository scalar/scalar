<script lang="ts" setup>
import { standardLanguages, syntaxHighlight } from '@scalar/code-highlight'
import { prettyPrintJson } from '@scalar/oas-utils/helpers'
import { computed, useId } from 'vue'

import { ScalarCodeBlockCopy } from '../ScalarCodeBlock'

/**
 * Uses highlight.js for syntax highlighting
 */
const props = withDefaults(
  defineProps<{
    content: string | object
    lang?: string
    lineNumbers?: boolean
    hideCredentials?: string | string[]
    copy?: boolean
  }>(),
  {
    lang: 'plaintext',
    lineNumbers: false,
    copy: true,
  },
)

/** Base id for the code block */
const id = useId()

const highlightedCode = computed(() => {
  const html = syntaxHighlight(prettyPrintJson(props.content), {
    lang: props.lang.trim(),
    languages: standardLanguages,
    lineNumbers: props.lineNumbers,
    maskCredentials: props.hideCredentials,
  })

  // Need to remove the wrapping <pre> element so we can use v-html without another wrapper
  return html.slice(5, -6)
})

const isContentValid = computed(() => {
  return (
    props.content !== null &&
    props.content !== 'null' &&
    props.content !== '404 Not Found'
  )
})
</script>
<template>
  <div
    class="scalar-code-block group/code-block custom-scroll min-h-12 focus-visible:outline"
    tabindex="0">
    <ScalarCodeBlockCopy
      v-if="copy && isContentValid"
      :content="prettyPrintJson(props.content)"
      :controls="id" />
    <pre
      :id="id"
      class="scalar-codeblock-pre"
      v-html="highlightedCode" />
  </div>
</template>
<style>
@import '@scalar/code-highlight/css/code.css';
.scalar-code-block {
  background: inherit;
  position: relative;
  overflow: auto;
  padding: 10px 8px 12px 12px;
}

/* Code blocks */
.scalar-codeblock-pre {
  all: unset;
  margin: 0;
  background: transparent;
  text-wrap: nowrap;
  white-space-collapse: preserve;
  border-radius: 0;
  width: fit-content;
}
</style>
