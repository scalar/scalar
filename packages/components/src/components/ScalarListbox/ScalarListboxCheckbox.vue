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
      selected ? 'bg-c-accent text-b-1' : 'text-transparent shadow-border',
      style === 'checkbox' ? 'rounded' : 'rounded-full',
    ]">
    <!-- Icon needs help to be optically centered (╥﹏╥) -->
    <ScalarIcon
      v-if="selected"
      class="relative top-[0.5px] size-3"
      icon="Checkmark"
      thickness="3" />
  </div>
</template>
