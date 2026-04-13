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
import { computed, shallowRef, watchEffect, type Component } from 'vue'

import type { ScalarIconProps } from './types'
import { getIcon, getLogo } from './utils'
import { variants } from './variants'

const props = defineProps<ScalarIconProps>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()

const stroke = computed(() => props.thickness ?? '2')

const accessibilityAttrs = computed(() =>
  props.label
    ? { 'aria-label': props.label }
    : {
        'aria-hidden': true,
        'role': 'presentation',
      },
)

const svg = shallowRef<Component | null>(null)

watchEffect((onCleanup) => {
  let isCancelled = false

  const loadIcon = async () => {
    let component: Component | null = null

    if (props.icon) {
      component = await getIcon(props.icon)
    } else if (props.logo) {
      component = await getLogo(props.logo)
    }

    if (!isCancelled) {
      svg.value = component
    }
  }

  void loadIcon()

  onCleanup(() => {
    isCancelled = true
  })
})
</script>
<template>
  <component
    :is="svg"
    v-if="svg"
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
