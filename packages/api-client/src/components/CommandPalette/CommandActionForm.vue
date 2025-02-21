<script setup lang="ts">
import { ScalarButton, type useLoadingState } from '@scalar/components'

const { loading, disabled = false } = defineProps<{
  loading?: ReturnType<typeof useLoadingState>
  disabled: boolean
}>()

defineEmits<{
  (event: 'submit'): void
  (event: 'cancel'): void
  (event: 'back', e: KeyboardEvent): void
}>()
</script>
<template>
  <form
    class="flex w-full flex-col gap-3"
    @keydown.enter.stop
    @submit.prevent.stop="$emit('submit')">
    <div class="flex flex-col rounded min-h-20 relative">
      <slot />
    </div>
    <div class="flex gap-2">
      <div class="flex flex-1 max-h-8">
        <slot name="options" />
      </div>
      <ScalarButton
        class="max-h-8 text-xs p-0 px-3"
        :disabled="disabled"
        :loading="loading"
        type="submit">
        <slot name="submit">Continue</slot>
      </ScalarButton>
    </div>
  </form>
</template>
