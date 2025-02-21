<script setup lang="ts">
import { ScalarButton } from '@scalar/components'

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
    <div class="flex gap-10 justify-between">
      <ScalarButton
        class="gap-1.5 px-2.5 h-8 shadow-none focus:outline-none flex items-center cursor-pointer"
        type="button"
        variant="outlined"
        @click="emit('cancel')">
        Cancel
      </ScalarButton>
      <ScalarButton
        class="gap-1.5 font-medium px-2.5 h-8 shadow-none focus:outline-none custom-scroll whitespace-nowrap"
        type="submit"
        :variant="danger ? 'danger' : 'solid'">
        {{ label ?? 'Save' }}
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
