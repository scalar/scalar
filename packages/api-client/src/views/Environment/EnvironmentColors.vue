<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'

defineProps<{
  activeColor: string
}>()

defineEmits<{
  (e: 'select', color: string): void
}>()

const options = [
  { color: 'grey', bgClass: 'bg-grey' },
  { color: 'red', bgClass: 'bg-red' },
  { color: 'yellow', bgClass: 'bg-yellow' },
  { color: 'green', bgClass: 'bg-green' },
  { color: 'orange', bgClass: 'bg-orange' },
  { color: 'blue', bgClass: 'bg-blue' },
  { color: 'text-c-2', bgClass: 'bg-c-2' },
  { color: 'purple', bgClass: 'bg-purple' },
  { color: 'pink', bgClass: 'bg-pink' },
]
</script>
<template>
  <div class="flex flex-row gap-1.5 space-x-1">
    <div
      v-for="option in options"
      :key="option.color"
      class="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full"
      :class="option.bgClass"
      @click="$emit('select', option.color)">
      <ScalarIcon
        v-if="activeColor === option.color"
        icon="Checkmark"
        size="xs" />
    </div>
  </div>
</template>
