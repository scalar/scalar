<script lang="ts">
/**
 * Scalar Text Wrapping component
 *
 * Adds word breaks to the text to allow improved line wrapping
 *
 * Does not inherit any attributes because it returns a set of html nodes
 *
 * @example
 * <ScalarWrappingText text="/this/is/a/long/path/that/needs/to/be/wrapped" />
 */
export default {}
</script>
<script setup lang="ts">
import { computed } from 'vue'

import { PRESETS } from './constants'
import type { ScalarWrappingTextProps } from './types'

const {
  text = '',
  preset = 'path',
  regex,
} = defineProps<ScalarWrappingTextProps>()

/**
 * Unicode character for zero-width non-joiner
 *
 * @see https://en.wikipedia.org/wiki/Zero-width_non-joiner
 */
const ZWNJ = '\u2060'

// We don't want to inherit any attributes because we going to return many nodes
defineOptions({ inheritAttrs: false })

const words = computed<string[]>(() => {
  const wrapRegex = new RegExp(regex ?? PRESETS[preset], 'g')
  // Insert the marker before each delimiter
  const marked = text.replace(wrapRegex, `${ZWNJ}$&`)
  // Split on the marker and filter out any empty strings
  return marked.split(ZWNJ).filter(Boolean)
})
</script>
<template>
  <template
    v-for="(word, i) in words"
    :key="i">
    <wbr />{{ word }}
  </template>
</template>
