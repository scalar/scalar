<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'

import { type Icon, ScalarIconLegacyAdapter } from '../ScalarIcon'
import type { ScalarIconButtonProps } from './types'
import { variants } from './variants'

const { tooltip } = defineProps<ScalarIconButtonProps>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <button
    :ariaDisabled="disabled || undefined"
    type="button"
    v-bind="cx(variants({ size, variant, disabled }))">
    <ScalarIconLegacyAdapter
      :icon="icon"
      :thickness="thickness"
      :weight="weight" />
    <span class="sr-only">{{ label }}</span>
  </button>
</template>
