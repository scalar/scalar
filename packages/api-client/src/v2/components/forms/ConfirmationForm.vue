<script setup lang="ts">
import { ScalarButton } from '@scalar/components'

const { label = 'Save', variant = 'solid' } = defineProps<{
  /** The label of the submit button */
  label?: string
  /** Sets the style of the submit button */
  variant?: 'danger' | 'solid'
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'submit'): void
}>()
</script>
<template>
  <form
    class="flex flex-col gap-4 text-base"
    @submit.prevent="emit('submit')">
    <slot />

    <div class="flex justify-between gap-10">
      <!-- Cancel -->
      <ScalarButton
        class="flex h-8 cursor-pointer items-center gap-1.5 px-2.5 shadow-none focus:outline-none"
        type="button"
        variant="outlined"
        @click="emit('cancel')">
        Cancel
      </ScalarButton>

      <!-- Submit -->
      <ScalarButton
        class="custom-scroll h-8 gap-1.5 px-2.5 font-medium whitespace-nowrap shadow-none focus:outline-none"
        type="submit"
        :variant="variant">
        {{ label }}
      </ScalarButton>
    </div>
  </form>
</template>

<style scoped>
.scalar-modal-layout .scalar-button-danger {
  background: color-mix(in srgb, var(--scalar-color-red), transparent 95%);
  color: var(--scalar-color-red);
}
.scalar-modal-layout .scalar-button-danger:hover,
.scalar-modal-layout .scalar-button-danger:focus {
  background: color-mix(in srgb, var(--scalar-color-red), transparent 90%);
}
</style>
