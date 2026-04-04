<script setup lang="ts">
import { ScalarIconCheck } from '@scalar/icons'

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
  <button
    :aria-pressed="isSelected"
    class="group flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors duration-100"
    :class="[
      isSelected
        ? 'bg-accent-color/10 text-c-1'
        : 'text-c-3 hover:bg-b-3 hover:text-c-2',
      isDisabled && 'pointer-events-none opacity-50',
    ]"
    :disabled="isDisabled"
    type="button"
    @click="emit('toggle')">
    <!-- Checkbox indicator -->
    <span
      class="flex size-3.5 shrink-0 items-center justify-center rounded-sm border transition-colors duration-100"
      :class="[
        isSelected
          ? 'border-accent-color bg-accent-color text-white'
          : 'border-c-3 group-hover:border-c-2 bg-transparent',
      ]">
      <ScalarIconCheck
        v-if="isSelected"
        class="size-2.5" />
    </span>

    <!-- Name -->
    <span class="min-w-0 flex-1 truncate">{{ name }}</span>

    <!-- Order badge - always rendered to prevent layout shift -->
    <span
      class="shrink-0 text-[0.65rem] tabular-nums transition-opacity duration-100"
      :class="
        isSelected && orderIndex && orderIndex > 0
          ? 'text-c-3 opacity-100'
          : 'opacity-0'
      ">
      #{{ orderIndex ?? 0 }}
    </span>
  </button>
</template>
