<script lang="ts" setup>
import ScalarCopyBackdrop from '@/components/ScalarCopy/ScalarCopyBackdrop.vue'
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
  copy?: 'always' | 'hover' | false
}

/**
 * Uses highlight.js for syntax highlighting
 *
 * Requires at least one of content or prettyPrintedContent
 */
const {
  lang = 'plaintext',
  lineNumbers = false,
  copy = 'hover',
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

/** Determine if the content is a single line */
const isOneLine = computed(() => !prettyContent.value.includes('\n'))

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
      class="scalar-code-copy absolute"
      :class="[
        isOneLine
          ? 'top-[calc(10px+0.5lh)] -translate-y-1/2 m-0 right-1'
          : 'top-2.5 right-2.5',
        { 'opacity-100': copy === 'always' },
      ]"
      :content="prettyContent"
      :showLang="!isOneLine"
      :lang="lang"
      :aria-controls="id">
      <template #backdrop>
        <ScalarCopyBackdrop
          class="scalar-code-copy-backdrop"
          :class="[
            isOneLine
              ? '-inset-y-0.75 -right-1 group-hocus-within/code-block:-left-0.5 left-3'
              : '-right-1.5 -top-1',
          ]" />
      </template>
    </ScalarCodeBlockCopy>
  </div>
</template>
<style>
@reference '../../style.css';
@import '@scalar/code-highlight/css/code.css';

/** Make the copy button label backdrop match the background */
.scalar-code-block.bg-b-1 .scalar-code-copy-backdrop {
  @apply bg-b-1;
}
.scalar-code-block.bg-b-2 .scalar-code-copy-backdrop {
  @apply bg-b-2;
}
/** Make the copy button one shade darker than the background */
.scalar-code-block.bg-b-2 .scalar-code-copy {
  @apply bg-b-3;
}
</style>
