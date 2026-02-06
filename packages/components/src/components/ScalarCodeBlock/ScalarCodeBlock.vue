<script lang="ts" setup>
import { standardLanguages, syntaxHighlight } from '@scalar/code-highlight'
import { prettyPrintJson } from '@scalar/oas-utils/helpers'
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { computed, useId } from 'vue'

import { ScalarCodeBlockCopy } from '../ScalarCodeBlock'
import type { StandardLanguageKey } from './types'

type BaseProps = {
  content?: string | object
  prettyPrintedContent?: string
  lang?: StandardLanguageKey | string
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

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <div
    v-bind="
      cx(
        'scalar-code-block group/code-block flex flex-col',
        'relative bg-b-1 min-h-0 min-w-0 focus-visible:outline',
      )
    ">
    <div
      tabindex="0"
      class="custom-scroll overflow-x-auto p-2 -outline-offset-2 min-h-0 min-w-0 flex-1">
      <pre
        :id="id"
        class="m-0 bg-transparent text-nowrap whitespace-pre w-fit"
        v-html="highlightedCode" />
    </div>
    <ScalarCodeBlockCopy
      v-if="copy && isContentValid"
      class="absolute top-2.5 right-2.5 bg-inherit"
      :content="prettyContent"
      :lang
      :aria-controls="id" />
  </div>
</template>
<style>
@import '@scalar/code-highlight/css/code.css';
</style>
