<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'

defineProps<{
  danger?: boolean
  label?: string
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
    <div class="flex justify-between">
      <button
        class="border text-left bg-b-1 focus:bg-b-2 hover:bg-b-2 rounded gap-1.5 px-2.5 py-1.5 focus:outline-none flex items-center cursor-pointer"
        type="button"
        @click="emit('cancel')">
        <ScalarIcon
          class="inline-flex"
          icon="Close"
          size="sm"
          thickness="1.75" />
        Cancel
      </button>
      <button
        class="bg-red text-left focus:bg-b-2 hover:bg-b-2 rounded gap-1.5 px-2.5 py-1.5 focus:outline-none flex items-center cursor-pointer delete-warning-button"
        :error="danger"
        type="submit"
        @click="emit('submit')">
        <ScalarIcon
          class="inline-flex"
          icon="Delete"
          size="sm"
          thickness="1.5" />
        {{ label ?? 'Submit' }}
      </button>
    </div>
  </form>
</template>
<style scoped>
.delete-warning-button {
  background: color-mix(in srgb, var(--scalar-color-red), transparent 95%);
  color: var(--scalar-color-red);
}
.delete-warning-button:hover,
.delete-warning-button:focus {
  background: color-mix(in srgb, var(--scalar-color-red), transparent 90%);
}
</style>
