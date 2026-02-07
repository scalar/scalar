<script setup lang="ts">
import { ScalarCopy } from '@/components/ScalarCopy'
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { computed } from 'vue'

import { LANGUAGE_LABELS } from './constants'
import type { StandardLanguageKey } from './types'

const { content } = defineProps<{
  /** Content to copy to clipboard */
  content: string | object
  /** Language of the code block */
  lang?: StandardLanguageKey | string
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

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>

<template>
  <ScalarCopy
    :content="contentToCopy"
    showLabel
    v-model:copied="copied"
    placement="left"
    v-bind="{
      ...cx(
        'scalar-code-copy',
        copied
          ? 'opacity-100'
          : [
              'opacity-0',
              'group-hover/code-block:opacity-100',
              'group-focus-visible/code-block:opacity-100',
              'group-focus-within/code-block:opacity-100',
            ],
      ),
    }">
    <template
      v-if="lang"
      #copy>
      <span class="hidden group-hover/code-block:inline">
        <span
          class="group-hover/copy-button:hidden"
          :class="{ capitalize: !isStandardLanguage(lang) }">
          {{ isStandardLanguage(lang) ? LANGUAGE_LABELS[lang] : lang }}
        </span>
        <span class="hidden group-hover/copy-button:inline">Copy</span>
      </span>
    </template>
  </ScalarCopy>
</template>
