<script lang="ts" setup>
import { standardLanguages, syntaxHighlight } from '@scalar/code-highlight'
import { prettyPrintJson } from '@scalar/oas-utils/helpers'
import { computed, useId } from 'vue'

import { ScalarCodeBlockCopy } from '../ScalarCodeBlock'

type BaseProps = {
  content?: string | object
  prettyPrintedContent?: string
  lang?: string
  lineNumbers?: boolean
  hideCredentials?: string | string[]
  copy?: boolean
}

/**
 * Uses highlight.js for syntax highlighting
 *
 * Requires at least one of content or prettyPrintedContent
 */
const {
  lang = 'plaintext',
  lineNumbers = false,
  copy = true,
  content,
  prettyPrintedContent,
  hideCredentials,
} = defineProps<
  BaseProps &
    (
      | {
          /** Raw unformatted object or string content */
          content: string | object
        }
      | {
          /**
           * Pre-pretty printed content string for better performance
           *
           * Avoids unnecessary costly re-serialization of large content
           */
          prettyPrintedContent: string
        }
    )
>()

/** Base id for the code block */
const id = useId()

/** Formatted the content into an indented json string */
const prettyContent = computed(
  () => prettyPrintedContent || prettyPrintJson(content ?? ''),
)

const highlightedCode = computed(() => {
  const html = syntaxHighlight(prettyContent.value, {
    lang: lang.trim(),
    languages: standardLanguages,
    lineNumbers: lineNumbers,
    maskCredentials: hideCredentials,
  })

  // Need to remove the wrapping <pre> element so we can use v-html without another wrapper
  return html.slice(5, -6)
})

const isContentValid = computed(() => {
  return (
    prettyContent.value !== null &&
    prettyContent.value !== 'null' &&
    prettyContent.value !== '404 Not Found'
  )
})
</script>
<template>
  <div
    class="scalar-code-block group/code-block custom-scroll min-h-12 focus-visible:outline"
    tabindex="0">
    <ScalarCodeBlockCopy
      v-if="copy && isContentValid"
      :content="prettyContent"
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
