<script setup lang="ts">
import { ScalarButton } from '@scalar/components'

defineProps<{
  disabled?: boolean
}>()

defineEmits<{
  (event: 'submit'): void
  (event: 'cancel'): void
}>()
</script>
<template>
  <form
    class="flex w-full flex-col gap-3"
    @keydown.enter.stop
    @submit.prevent.stop="$emit('submit')">
    <div class="gap-3 rounded min-h-20 relative">
      <slot />
    </div>
    <div class="flex gap-2">
      <div class="flex flex-1 max-h-8">
        <slot name="options" />
      </div>
      <ScalarButton
        class="max-h-8 text-xs p-0 px-3"
        :disabled="disabled"
        type="submit">
        <slot name="submit">Continue</slot>
      </ScalarButton>
    </div>
  </form>
</template>
