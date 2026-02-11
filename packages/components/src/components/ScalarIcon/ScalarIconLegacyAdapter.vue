<script setup lang="ts">
/**
 * Scalar Icon Legacy Adapter
 *
 * This component is used to help components that accept a ScalarIcon name
 * as a prop to accept a component instead to be compatible with `@scalar/icons`
 * while staying backwards compatible with the legacy ScalarIcon component
 */
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
 * Icon wrapper for all icons and logos
 */
const { icon, size, label, weight, thickness } = defineProps<
  {
    icon: Icon | ScalarIconComponent
  } & ScalarIconProps &
    Omit<LegacyScalarIconProps, 'icon'>
>()

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

defineOptions({ inheritAttrs: false })

const { cx } = useBindCx()

const legacyThickness = computed(
  () => (weight != null ? WEIGHT_TO_THICKNESS[weight] : thickness) ?? '2',
)

/** Pass only props the legacy ScalarIcon accepts so weight is never forwarded (legacy uses thickness). */
const legacyIconBind = computed(
  (): LegacyScalarIconProps & { thickness: string } => ({
    icon: icon as Icon,
    size: size,
    label: label,
    thickness: legacyThickness.value,
  }),
)
</script>
<template>
  <ScalarIcon
    v-if="typeof icon === 'string'"
    v-bind="{ ...legacyIconBind, ...$attrs }" />
  <component
    :is="icon"
    v-else
    :label="label"
    :weight="weight"
    v-bind="cx(variants({ size }))" />
</template>
