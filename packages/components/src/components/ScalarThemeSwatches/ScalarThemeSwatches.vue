<script lang="ts">
/**
 * Scalar Theme Swatches component
 *
 * Displays the light and dark mode swatches for a given theme CSS string
 *
 * @example
 * <ScalarThemeSwatches :css="theme" />
 */
export default {}
</script>
<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'

import { THEME_CSS_VARS, useThemeSwatches } from './useThemeSwatches'

const { css } = defineProps<{
  css: string
}>()

const { colors } = useThemeSwatches(() => css)

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <div
    :style="{
      '--bg-light': colors.light['--scalar-background-1'],
      '--bg-dark': colors.dark['--scalar-background-1'],
    }"
    v-bind="
      cx(
        'flex *:size-3 overflow-hidden rounded',
        'bg-(--bg-light) dark:bg-(--bg-dark)',
      )
    ">
    <div
      v-for="v in THEME_CSS_VARS"
      :key="v"
      class="bg-(--bg-light) dark:bg-(--bg-dark)"
      :style="{ '--bg-light': colors.light[v], '--bg-dark': colors.dark[v] }" />
  </div>
</template>
