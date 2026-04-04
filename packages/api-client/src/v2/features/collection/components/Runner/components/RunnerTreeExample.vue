<script setup lang="ts">
const {
  name,
  isSelected = false,
  isDisabled = false,
  orderIndex,
} = defineProps<{
  name: string
  isSelected?: boolean
  isDisabled?: boolean
  orderIndex?: number
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
}>()
</script>

<template>
  <label
    class="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-transparent px-2.5 py-1.5 text-xs transition-all duration-150"
    :class="[
      isSelected
        ? 'bg-accent-color/10 border-accent-color text-c-1'
        : 'bg-b-2 text-c-3 hover:bg-b-3 hover:text-c-1',
      isDisabled && 'cursor-not-allowed',
    ]">
    <input
      :checked="isSelected"
      class="accent-accent-color m-0 size-3.5 cursor-pointer disabled:cursor-not-allowed"
      :disabled="isDisabled"
      type="checkbox"
      @change="emit('toggle')" />
    <span class="select-none">{{ name }}</span>
    <span
      v-if="orderIndex && orderIndex > 0"
      class="bg-accent-color/15 text-accent-color ml-0.5 rounded px-1.5 py-0.5 text-[0.625rem] font-semibold">
      #{{ orderIndex }}
    </span>
  </label>
</template>
