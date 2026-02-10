<script lang="ts">
/**
 * Scalar Icon Legacy Adapter
 *
 * This component is used to help components that accept a ScalarIcon name
 * as a prop to accept a component instead to be compatible with `@scalar/icons`
 * while staying backwards compatible with the legacy ScalarIcon component
 */
export default {}
</script>
<script setup lang="ts">
import type {
  ScalarIconComponent,
  ScalarIconProps,
  ScalarIconWeight,
} from '@scalar/icons/types'
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { computed } from 'vue'

import ScalarIcon from './ScalarIcon.vue'
import type { ScalarIconProps as LegacyScalarIconProps } from './types'
import type { Icon } from './utils'
import { variants } from './variants'

/**
 * Maps weight to legacy thickness for the string-icon branch.
 * Lets callers pass only weight; legacy ScalarIcon still receives a thickness value.
 */
const WEIGHT_TO_THICKNESS: Record<ScalarIconWeight, string> = {
  thin: '1',
  light: '1.5',
  regular: '2',
  bold: '2.5',
  fill: '2.5',
  duotone: '2.5',
}

/**
 * Icon wrapper for all icons and logos
 */
const props = defineProps<
  {
    icon: Icon | ScalarIconComponent
  } & ScalarIconProps &
    Omit<LegacyScalarIconProps, 'icon'>
>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()

const legacyThickness = computed(
  () =>
    (props.weight != null
      ? WEIGHT_TO_THICKNESS[props.weight]
      : props.thickness) ?? '2',
)
</script>
<template>
  <ScalarIcon
    v-if="typeof icon === 'string'"
    v-bind="{ ...$props, ...$attrs }"
    :icon="icon"
    :thickness="legacyThickness" />
  <component
    :is="icon"
    v-else
    :label="label"
    :weight="weight"
    v-bind="cx(variants({ size }))" />
</template>
