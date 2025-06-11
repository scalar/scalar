<script setup lang="ts">
import { ScalarIconCheck } from '@scalar/icons'

import { ScalarIcon } from '../ScalarIcon'
import type { OptionStyle } from './types'

defineProps<{
  selected?: boolean
  style?: OptionStyle
}>()
</script>
<template>
  <div
    class="flex size-4 items-center justify-center p-0.75"
    :class="[
      selected ? 'bg-c-accent text-b-1' : 'text-transparent shadow-border',
      style === 'checkbox' ? 'rounded' : 'rounded-full',
    ]">
    <ScalarIconCheck
      v-if="selected"
      class="size-3"
      weight="bold" />
  </div>
</template>
