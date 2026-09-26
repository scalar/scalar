<script lang="ts">
/**
 * Scalar Code Block component
 *
 * Renders syntax-highlighted code using highlight.js.
 * Supports line numbers, credential masking, and an optional copy button.
 *
 * @example
 * <ScalarCodeBlock content="const x = 1" lang="javascript" />
 */
export default {}
</script>
<script lang="ts" setup>
import ScalarCopyBackdrop from '@/components/ScalarCopy/ScalarCopyBackdrop.vue'
import { standardLanguages, syntaxHighlight } from '@scalar/code-highlight'
import { prettyPrintJson } from '@scalar/helpers/json/pretty-print-json'
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { useResizeObserver } from '@vueuse/core'
import { computed, ref, useId, useTemplateRef } from 'vue'

import { ScalarCodeBlockCopy } from '../ScalarCodeBlock'
import type { StandardLanguageKey } from './types'

type BaseProps = {
  content?: string | object
  prettyPrintedContent?: string
  lang?: StandardLanguageKey | string
  lineNumbers?: boolean
  hideCredentials?: string | string[]
  copy?: 'always' | 'hover' | false
  /**
   * Accessible name for the code scroller while it is a tab stop. Long code scrolls inside a
   * focusable region so keyboard users can reach it, and a focusable region needs a name or
   * screen readers announce nothing when focus lands on it.
   */
  label?: string
  /**
   * Accessible name for the copy button. The visible label only reads "Copy" (and the language)
   * while the block is hovered, so the name has to say what is copied on its own.
   */
  copyLabel?: string
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
  label = 'Code sample',
  copyLabel,
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

/** Whether the copy button is rendered on top of the code */
const showCopy = computed(() => copy && isContentValid.value)

/**
 * A one-liner has the copy button floating over the end of the line, so the line needs room to
 * scroll clear of the button. The padding goes on the `w-fit` <pre> because browsers disagree about
 * whether trailing padding on an `overflow-x` container is scrollable.
 */
const reserveCopySpace = computed(() => isOneLine.value && showCopy.value)

/** The scroll container around the highlighted code */
const scroller = useTemplateRef<HTMLDivElement>('scroller')

/** The `<pre>` is `w-fit`, so it is the element whose size changes when the code changes */
const code = useTemplateRef<HTMLPreElement>('code')

/**
 * Whether the code overflows its container. A scrollable region has to stay reachable by
 * keyboard (WCAG 2.1.1), but a block that fits does not need a tab stop of its own; an
 * accessibility audit flagged the extra stop on short samples. Starts as true so the region is
 * never unreachable before the first measurement, or where ResizeObserver does not exist (SSR,
 * jsdom). A `display: none` block gets no initial notification and keeps the default until it
 * is shown, which is harmless because a hidden element cannot be focused anyway.
 */
const isScrollable = ref(true)

/** ResizeObserver reports once on observe and again whenever either box changes size */
useResizeObserver([scroller, code], () => {
  const el = scroller.value
  if (!el) {
    return
  }
  isScrollable.value =
    el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight
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
    <!--
      Inherits the corners so the inset focus ring follows a rounded code block.
      Only a tab stop, and only named, while there is something to scroll. `-1` rather than no
      attribute keeps click focus, so the copy button stays revealed after a click exactly as
      before, and opts the element out of the browser's keyboard-focusable-scroller heuristic.
    -->
    <div
      ref="scroller"
      :aria-label="isScrollable ? label : undefined"
      class="custom-scroll overflow-x-auto p-2 -outline-offset-2 rounded-[inherit] min-h-0 min-w-0 flex-1"
      :role="isScrollable ? 'group' : undefined"
      :tabindex="isScrollable ? 0 : -1">
      <pre
        :id="id"
        ref="code"
        class="m-0 bg-transparent text-nowrap whitespace-pre w-fit"
        :class="{ 'pr-6': reserveCopySpace }"
        v-html="highlightedCode" />
    </div>
    <ScalarCodeBlockCopy
      v-if="showCopy"
      class="scalar-code-copy absolute"
      :class="[
        isOneLine
          ? 'top-1/2 -translate-y-1/2 m-0 right-1'
          : 'top-2.5 right-2.5',
        { 'opacity-100': copy === 'always' },
      ]"
      :content="prettyContent"
      :copyLabel="copyLabel"
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

/** Disable font ligatures so code renders with literal characters */
.scalar-code-block pre {
  font-variant-ligatures: none;
}

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
