<script lang="ts">
import { languages, registerLanguage } from '@scalar/highlight/all'

/**
 * Registers every bundled grammar, once per module rather than once per block.
 *
 * `@scalar/highlight/all` already registers them when it is evaluated, so a
 * bare `import '@scalar/highlight/all'` reads like enough. It is not: that is a
 * side-effect-only import of an external package, and the library build drops
 * it from the emitted module. Storybook hid this because it compiles from
 * source, while the API reference consumes `dist` and lost highlighting
 * entirely — every block fell back to escaped, unscoped text.
 *
 * Registering from a named import keeps a binding the bundler can see used, so
 * the module survives. It lives in this block rather than in `<script setup>`
 * because setup runs for every instance, and a page of API reference renders
 * hundreds of code blocks.
 */
registerLanguage(...languages)

/**
 * Scalar Code Block component
 *
 * Renders syntax-highlighted code using @scalar/highlight.
 * Supports line numbers, credential masking, and an optional copy button.
 * Set --scalar-code-line-height on the component or an ancestor to override its 1.4 line height.
 *
 * @example
 * <ScalarCodeBlock content="const x = 1" lang="javascript" />
 */
export default {}
</script>
<script lang="ts" setup>
import { prettyPrintJson } from '@scalar/helpers/json/pretty-print-json'
import { syntaxHighlight, syntaxHighlightLines } from '@scalar/highlight/compat'
import { ScalarIconCaretDown, ScalarIconCaretRight } from '@scalar/icons'
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { computed, ref, useId, watch } from 'vue'

import ScalarCopyBackdrop from '@/components/ScalarCopy/ScalarCopyBackdrop.vue'

import { ScalarCodeBlockCopy } from '../ScalarCodeBlock'
import { getCodeFoldRanges } from './get-code-fold-ranges'
import {
  MAX_HIGHLIGHTED_LINE_LENGTH,
  useCodeHighlighting,
} from './use-code-highlighting'
import { useCodeViewport } from './use-code-viewport'
import type { StandardLanguageKey } from './types'

type BaseProps = {
  content?: string | object
  prettyPrintedContent?: string
  lang?: StandardLanguageKey | string
  lineNumbers?: boolean
  /** Wrap long lines at the edge of the code scroller. */
  wrap?: boolean
  /** Show disclosure buttons for multi-line blocks in supported languages. */
  foldable?: boolean
  /** Limit mounted lines in long blocks. Use inside a bounded scroll area. */
  virtualize?: boolean
  hideCredentials?: string | string[]
  copy?: 'always' | 'hover' | false
  /** Show the language in the copy button for multiline code. */
  showCopyLanguage?: boolean
  /** Original content to copy when the displayed content has been masked. */
  copyContent?: string
  /**
   * Accessible name for the code scroller. Long code scrolls inside a focusable region so
   * keyboard users can reach it, and a focusable region needs a name or screen readers announce
   * nothing when focus lands on it.
   */
  label?: string
  /**
   * Accessible name for the copy button. The visible label only reads "Copy" (and the language)
   * while the block is hovered, so the name has to say what is copied on its own.
   */
  copyLabel?: string
}

/**
 * Uses @scalar/highlight for syntax highlighting
 *
 * Requires at least one of content or prettyPrintedContent
 */
const {
  lang = 'plaintext',
  lineNumbers = false,
  wrap = false,
  foldable = false,
  virtualize = false,
  copy = 'hover',
  showCopyLanguage = true,
  label = 'Code sample',
  copyLabel,
  copyContent,
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
  () => prettyPrintedContent ?? prettyPrintJson(content ?? ''),
)

const highlightedCode = computed(() => {
  const html = syntaxHighlight(prettyContent.value, {
    lang: lang.trim(),
    lineNumbers: lineNumbers,
    maskCredentials: hideCredentials,
  })

  // Need to remove the wrapping <pre> element so we can use v-html without another wrapper
  return html.slice(5, -6)
})

const sourceLines = computed(() => prettyContent.value.split('\n'))
// Credentials must never be exposed on plain lines while highlighting catches up.
const isVirtual = computed(
  () =>
    virtualize &&
    !hideCredentials?.length &&
    (prettyContent.value.length > MAX_HIGHLIGHTED_LINE_LENGTH ||
      sourceLines.value.length > 100),
)
const { highlightedDocument, revision } = useCodeHighlighting({
  enabled: () => isVirtual.value,
  code: () => prettyContent.value,
  lang: () => lang,
  foldable: () => foldable,
  sourceLines: () => sourceLines.value,
})
const foldRanges = computed(() =>
  isVirtual.value
    ? highlightedDocument.value?.ranges
    : foldable
      ? getCodeFoldRanges(prettyContent.value, lang)
      : undefined,
)
const folded = ref(new Map<number, number>())
const scroll = ref<HTMLElement | null>(null)
const characterWidthProbe = ref<HTMLElement | null>(null)

watch([prettyContent, () => lang, () => foldable], () => folded.value.clear())

const highlightedLines = computed(() =>
  !isVirtual.value && foldRanges.value?.size
    ? syntaxHighlightLines(prettyContent.value, {
        lang,
        maskCredentials: hideCredentials,
      })
    : [],
)

const expandedLines = computed(() => {
  if (!folded.value.size) return undefined
  const lines: number[] = []
  for (let index = 0; index < sourceLines.value.length; index++) {
    lines.push(index)
    index = folded.value.get(index) ?? index
  }
  return lines
})

const renderedAsRows = computed(
  () => isVirtual.value || !!foldRanges.value?.size,
)

const { lineWindow, maxColumns, onScroll, sourceLine } = useCodeViewport({
  enabled: () => isVirtual.value,
  lines: () => sourceLines.value,
  expandedLines: () => expandedLines.value,
  wrap: () => wrap,
  lineNumbers: () => lineNumbers,
  scroll,
  characterWidthProbe,
})

const visibleLines = computed(() => {
  const { start, end } = lineWindow.value
  const lines: {
    html: string | undefined
    text: string
    index: number
    canFold: boolean
    collapsed: boolean
  }[] = []
  void revision.value
  const highlights =
    highlightedDocument.value?.highlighter.lines ?? highlightedLines.value
  const ranges = foldRanges.value

  for (let row = start; row < end; row++) {
    const index = sourceLine(row)
    const text = sourceLines.value[index] ?? ''
    lines.push({
      html:
        isVirtual.value && text.length > MAX_HIGHLIGHTED_LINE_LENGTH
          ? undefined
          : highlights[index],
      text,
      index,
      canFold: ranges?.has(index) ?? false,
      collapsed: folded.value.has(index),
    })
  }
  return lines
})

watch(
  () => (isVirtual.value ? visibleLines.value : undefined),
  (lines) => {
    if (!lines) return
    const active = scroll.value?.ownerDocument.activeElement
    const row = active?.closest<HTMLElement>('[data-code-line]')
    if (
      scroll.value?.contains(row ?? null) &&
      !lines.some(({ index }) => index === Number(row?.dataset.codeLine))
    ) {
      scroll.value.focus({ preventScroll: true })
    }
  },
)

const toggleFold = (index: number): void => {
  if (folded.value.has(index)) {
    folded.value.delete(index)
  } else {
    const end = foldRanges.value?.get(index)
    if (end !== undefined) folded.value.set(index, end)
  }
}

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
      Always a tab stop so code that scrolls stays reachable by keyboard (WCAG 2.1.1). A named
      group rather than a region, so every code sample does not add a landmark.
    -->
    <div
      ref="scroll"
      :aria-label="label"
      class="custom-scroll min-h-0 min-w-0 flex-1 overflow-x-auto rounded-[inherit] p-2 -outline-offset-2"
      :class="{ 'scalar-code-viewport': isVirtual }"
      role="group"
      tabindex="0"
      @scroll.passive="isVirtual && onScroll()">
      <!-- prettier-ignore -->
      <div
        v-if="renderedAsRows"
        :id="id"
        class="scalar-code-block-pre scalar-code-block-folded"
        :class="wrap ? 'scalar-code-block-wrap w-full' : 'w-max min-w-full'"
        :style="{
          '--line-digits': sourceLines.length.toString().length,
          '--code-columns': isVirtual && !wrap ? maxColumns : undefined,
          paddingBlockStart: isVirtual ? `${lineWindow.top}px` : undefined,
          paddingBlockEnd: isVirtual ? `${lineWindow.bottom}px` : undefined,
        }">
        <span
          v-if="isVirtual && wrap"
          ref="characterWidthProbe"
          aria-hidden="true"
          class="pointer-events-none absolute invisible w-[32ch]" />
        <code class="hljs">
          <span
            v-for="line in visibleLines"
            :key="line.index"
            class="scalar-code-fold-line grid min-h-6 items-start gap-x-1"
            :class="lineNumbers ? 'grid-cols-[calc(var(--line-digits)*1ch)_24px_minmax(0,1fr)]' : 'grid-cols-[24px_minmax(0,1fr)]'"
            :data-code-line="line.index">
            <span
              v-if="lineNumbers"
              aria-hidden="true"
              class="text-c-2 self-start text-right select-none">{{ line.index + 1 }}</span>
            <span class="select-none">
              <button
                v-if="line.canFold"
                :aria-expanded="!line.collapsed"
                :aria-label="`Toggle code fold at line ${line.index + 1}`"
                class="text-c-2 hover:text-c-1 focus-visible:outline-c-accent flex size-6 cursor-pointer items-center justify-center rounded focus-visible:outline"
                type="button"
                @click="toggleFold(line.index)">
                <component
                  :is="line.collapsed ? ScalarIconCaretRight : ScalarIconCaretDown"
                  aria-hidden="true"
                  class="size-3" />
              </button>
            </span>
            <span class="scalar-code-fold-text">
              <span
                v-if="line.html !== undefined"
                v-html="line.html" /><span v-else>{{ line.text }}</span><span
                v-if="line.collapsed"
                aria-hidden="true"
                class="text-c-2 select-none"> …</span>
            </span>
          </span>
        </code>
      </div>
      <pre
        v-else
        :id="id"
        class="scalar-code-block-pre m-0 border-0 bg-transparent p-0"
        :class="[
          wrap
            ? 'scalar-code-block-wrap w-full'
            : 'w-fit text-nowrap whitespace-pre',
          { 'pr-6': reserveCopySpace },
        ]"
        v-html="highlightedCode" />
    </div>
    <ScalarCodeBlockCopy
      v-if="showCopy"
      :aria-controls="id"
      class="scalar-code-copy absolute"
      :class="[
        isOneLine
          ? 'top-1/2 right-1 m-0 -translate-y-1/2'
          : 'top-2.5 right-2.5',
        { 'opacity-100': copy === 'always' },
      ]"
      :content="copyContent ?? prettyContent"
      :copyLabel="copyLabel"
      :lang="lang"
      :showLang="showCopyLanguage && !isOneLine">
      <template #backdrop>
        <ScalarCopyBackdrop
          class="scalar-code-copy-backdrop"
          :class="[
            isOneLine
              ? 'group-hocus-within/code-block:-left-0.5 -inset-y-0.75 -right-1 left-3'
              : '-top-1 -right-1.5',
          ]" />
      </template>
    </ScalarCodeBlockCopy>
  </div>
</template>
<style>
@reference '../../style.css';
@import '@scalar/highlight/compat/code.css';

/** Match the pre line-box metrics to the code font so blank and highlighted lines have the same pitch. */
.scalar-code-block-pre {
  font-family: var(--scalar-font-code);
  /* Disable ligatures so code characters remain distinct. */
  font-variant-ligatures: none;
}

.scalar-code-viewport {
  overflow-anchor: none;
}

.scalar-code-viewport .scalar-code-block-folded:not(.scalar-code-block-wrap) {
  min-width: max(
    100%,
    calc((var(--code-columns) + var(--line-digits)) * 1ch + 2.5rem)
  );
}

.scalar-code-block-folded :where(code.hljs) * {
  white-space: normal;
}

.scalar-code-fold-line {
  line-height: 24px;
}

.scalar-code-block-folded .scalar-code-fold-text,
.scalar-code-block-folded .scalar-code-fold-text * {
  white-space: pre;
}

.scalar-code-block-wrap code.hljs,
.scalar-code-block-wrap code.hljs *,
.scalar-code-block-folded.scalar-code-block-wrap .scalar-code-fold-text,
.scalar-code-block-folded.scalar-code-block-wrap .scalar-code-fold-text * {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

/** Make the copy button label backdrop match the background */
.scalar-code-block.bg-b-1 .scalar-code-copy-backdrop {
  @apply bg-b-1;
}
.scalar-code-block.bg-b-2 .scalar-code-copy-backdrop {
  @apply bg-b-2;
}
/**
 * A transparent block shows the surface of the card it sits in, so the label takes that color.
 * Outside a card there is nothing to match, and the label goes without a backdrop.
 */
.scalar-code-block.bg-transparent .scalar-code-copy-backdrop {
  background: var(--scalar-card-surface, transparent);
}
/** Make the copy button one shade darker than the background */
.scalar-code-block.bg-b-2 .scalar-code-copy {
  @apply bg-b-3;
}
/**
 * On a card's surface the button's own fill is the color of the card behind the surface, which
 * reads as a hole in a dark card. It takes the card's raised color instead, one step above the
 * surface. Outside a card the button keeps its own fill.
 */
.scalar-code-block.bg-transparent .scalar-code-copy {
  background: var(--scalar-card-surface-raised, var(--scalar-background-2));
}
</style>
