<script lang="ts">
/**
 * Scalar icon button component
 *
 * Should be used in conjunction with an icon from `@scalar/icons`
 *
 * @example
 * import { ScalarIconAcorn } from '@scalar/icons'
 * ...
 * <ScalarIconButton
 *   :icon="ScalarIconAcorn"
 *   label="It's an acorn"
 * />
 */
export default {}
</script>
<script setup lang="ts">
import { cva, useBindCx } from '@scalar/use-hooks/useBindCx'
import { computed, defineAsyncComponent, useTemplateRef } from 'vue'

import { BUTTON_VARIANT_STYLES } from '../ScalarButton/constants'
import { useTooltip } from '../ScalarTooltip'
import type { ScalarIconButtonProps } from './types'

const {
  label,
  variant = 'ghost',
  size = 'md',
  tooltip,
  disabled,
  icon,
  weight,
  thickness,
} = defineProps<ScalarIconButtonProps>()

const variants = cva({
  base: 'scalar-icon-button grid aspect-square cursor-pointer rounded',
  variants: {
    size: {
      xxs: 'size-3.5 p-0.5',
      xs: 'size-5 p-1',
      sm: 'size-6 p-1',
      md: 'size-10 p-3',
      full: 'size-full',
    },
    disabled: {
      true: 'cursor-not-allowed shadow-none',
    },
    // We use the same button styles for the icon buttons
    variant: BUTTON_VARIANT_STYLES,
  },
  compoundVariants: [
    {
      size: 'md',
      variant: 'ghost',
      class: 'size-8 p-2 m-1 -outline-offset-2 rounded-lg',
    },
  ],
})

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()

const ScalarIconLegacyAdapter = defineAsyncComponent(
  () => import('../ScalarIcon/ScalarIconLegacyAdapter.vue'),
)

const isLegacyIcon = computed(() => typeof icon === 'string')

const button = useTemplateRef('ref')

useTooltip({
  content: computed(() => label),
  offset: computed(() => (variant === 'ghost' ? 0 : 4)),
  placement: computed(() =>
    typeof tooltip === 'boolean' ? undefined : tooltip,
  ),
  targetRef: computed(() => (tooltip ? button.value : undefined)),
})
</script>
<template>
  <button
    ref="ref"
    :aria-disabled="disabled"
    type="button"
    v-bind="cx(variants({ size, variant, disabled }))">
    <component
      :is="icon"
      v-if="!isLegacyIcon"
      :label="label"
      :weight="weight"
      v-bind="cx(variants({ size }))" />
    <ScalarIconLegacyAdapter
      v-else
      :icon="icon"
      :thickness="thickness"
      :weight="weight" />
    <span
      v-if="!tooltip"
      class="sr-only"
      >{{ label }}</span
    >
  </button>
</template>
