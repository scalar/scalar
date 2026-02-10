<script setup lang="ts">
import { ScalarCopy } from '@/components/ScalarCopy'
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { computed } from 'vue'

import { LANGUAGE_LABELS } from './constants'
import type { StandardLanguageKey } from './types'

const { content } = defineProps<{
  /** Whether to show the language label */
  showLang?: boolean
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
          {{ isStandardLanguage(lang) ? LANGUAGE_LABELS[lang] : lang }}
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
