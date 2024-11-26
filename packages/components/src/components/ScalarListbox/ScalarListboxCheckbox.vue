<script setup lang="ts">
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
      selected
        ? 'bg-c-accent text-b-1'
        : 'text-transparent group-hover/item:shadow-border',
      style === 'checkbox' ? 'rounded' : 'rounded-full',
    ]">
    <!-- Icon needs help to be optically centered (╥﹏╥) -->
    <ScalarIcon
      class="relative top-[0.5px] size-2.5"
      icon="Checkmark"
      thickness="2.5" />
  </div>
</template>
