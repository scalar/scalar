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
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { computed, useTemplateRef } from 'vue'

import { ScalarIconLegacyAdapter } from '../ScalarIcon'
import { useTooltip } from '../ScalarTooltip'
import type { ScalarIconButtonProps } from './types'
import { variants } from './variants'

const {
  label,
  variant = 'ghost',
  tooltip,
} = defineProps<ScalarIconButtonProps>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()

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
    <ScalarIconLegacyAdapter
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
