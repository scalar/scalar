<script lang="ts">
/**
 * Scalar Icon Wrapper
 *
 * @deprecated Use the icons from the `@scalar/icons` package instead.
 */
export default {}
</script>
<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { computed } from 'vue'

import type { ScalarIconProps } from './types'
import { getIcon, getLogo } from './utils'
import { variants } from './variants'

const { icon, logo, size, thickness, label } = defineProps<ScalarIconProps>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()

const stroke = computed(() => thickness ?? '2')

const accessibilityAttrs = computed(() =>
  label
    ? { 'aria-label': label }
    : {
        'aria-hidden': true,
        'role': 'presentation',
      },
)

const svg = computed(() => {
  if (icon) {
    return getIcon(icon)
  }
  if (logo) {
    return getLogo(logo)
  }

  return undefined
})
</script>
<template>
  <component
    :is="svg"
    v-bind="{
      ...cx('scalar-icon', variants({ size })),
      ...accessibilityAttrs,
    }" />
</template>
<style scoped>
.scalar-icon,
.scalar-icon * {
  stroke-width: v-bind(stroke);
}
</style>
