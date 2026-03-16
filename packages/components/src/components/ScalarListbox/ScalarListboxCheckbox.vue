<script setup lang="ts">
import { ScalarIconCheck } from '@scalar/icons'

defineProps<{
  selected?: boolean
  multiselect?: boolean
}>()
</script>
<template>
  <div
    class="flex size-4 items-center justify-center p-0.75"
    :class="[
      selected ? 'bg-c-accent text-b-1' : 'shadow-border text-transparent',
      multiselect ? 'rounded' : 'rounded-full',
    ]">
    <ScalarIconCheck
      v-if="selected"
      class="size-3"
      weight="bold" />
  </div>
</template>
