<script lang="ts">
/**
 * Scalar Code Block Copy button
 *
 * Displays a copy-to-clipboard button with an optional language label.
 * Used internally by ScalarCodeBlock.
 *
 * @example
 * <ScalarCodeBlockCopy content="const x = 1" lang="javascript" />
 */
export default {}
</script>
<script setup lang="ts">
import { ScalarCopy } from '@/components/ScalarCopy'
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { computed } from 'vue'

import { LANGUAGE_LABELS } from './constants'
import type { StandardLanguageKey } from './types'

const { content, lang, showLang, copyLabel } = defineProps<{
  /** Whether to show the language label */
  showLang?: boolean
  /** Content to copy to clipboard */
  content: string | object
  /** Language of the code block */
  lang?: StandardLanguageKey | string
  /**
   * Accessible name for the copy button.
   *
   * The visible label is hidden until the code block is hovered, so without an explicit name
   * screen readers announce an empty button (found by an accessibility audit). Defaults to
   * "Copy <language> code" so the name contains every word the button can show.
   */
  copyLabel?: string
}>()

const copied = defineModel<boolean>('copied', { default: false })

/** Handles the copy button click */
const contentToCopy = computed<string>(() => {
  return typeof content === 'string'
    ? content
    : JSON.stringify(content, null, 2)
})

/** Type guard to check if the language is a standard language */
const isStandardLanguage = (lang: string): lang is StandardLanguageKey =>
  lang in LANGUAGE_LABELS

/** The human readable language name shown next to the copy label */
const langLabel = computed<string | undefined>(() => {
  if (!lang) {
    return undefined
  }
  return isStandardLanguage(lang) ? LANGUAGE_LABELS[lang] : lang
})

/**
 * Names the button in every state, including while its visible label is `display: none`.
 * The language is included only when it is shown, so the name always contains the visible text
 * (WCAG 2.5.3) and request and response buttons on one page get distinct names.
 */
const accessibleName = computed<string>(() => {
  if (copyLabel) {
    return copyLabel
  }
  return showLang && langLabel.value
    ? `Copy ${langLabel.value} code`
    : 'Copy code'
})

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>

<template>
  <!-- The aria-label comes first so a consumer supplied aria-label attr still wins in the merge -->
  <ScalarCopy
    :aria-label="accessibleName"
    :content="contentToCopy"
    showLabel
    v-model:copied="copied"
    placement="left"
    v-bind="{
      ...cx(
        copied
          ? 'opacity-100'
          : 'opacity-0 group-hocus-within/code-block:opacity-100',
      ),
    }">
    <template
      v-if="lang"
      #copy>
      <span class="hidden group-hocus-within/code-block:inline">
        <span
          v-if="showLang"
          class="group-hocus/copy-button:sr-only"
          :class="{ capitalize: !isStandardLanguage(lang) }">
          {{ langLabel }}
        </span>
        <span
          :class="{
            'group-hocus/copy-button:not-sr-only sr-only': showLang,
          }"
          >Copy</span
        >
      </span>
    </template>
    <template #backdrop>
      <slot name="backdrop" />
    </template>
  </ScalarCopy>
</template>
