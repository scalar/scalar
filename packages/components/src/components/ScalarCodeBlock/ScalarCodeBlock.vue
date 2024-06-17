<script lang="ts" setup>
import { standardLanguages, syntaxHighlight } from '@scalar/code-highlight'
import '@scalar/code-highlight/css/code.css'
import { prettyPrintJson } from '@scalar/oas-utils/helpers'
import { computed } from 'vue'

/**
 * Uses highlight.js for syntax highlighting
 */
const props = withDefaults(
  defineProps<{
    content: string | object
    lang?: string
    lineNumbers?: boolean
    hideCredentials?: string | string[]
  }>(),
  {
    lang: 'plaintext',
    lineNumbers: false,
  },
)

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
</script>
<template>
  <pre
    class="scalar-component scalar-codeblock-pre"
    v-html="highlightedCode"></pre>
</template>
<style>
/* Code blocks */
.scalar-codeblock-pre {
  margin: 0;
  padding: 0.5rem;
  overflow: auto;
  background: transparent;
  text-wrap: nowrap;
  white-space-collapse: preserve;
  border-radius: 0;
}
</style>
