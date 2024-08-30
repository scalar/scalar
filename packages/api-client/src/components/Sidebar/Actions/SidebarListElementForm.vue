<script setup lang="ts">
import { ScalarButton } from '@scalar/components'
import { cva, cx } from 'cva'

defineProps<{
  danger?: boolean
  label?: string
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'submit'): void
}>()

const variants = cva({
  base: 'gap-1.5 font-medium px-2.5 h-8 shadow-none focus:outline-none',
  variants: {
    danger: {
      true: 'delete-warning-button',
      false: '',
    },
  },
})
</script>
<template>
  <form
    class="flex flex-col gap-4 text-base"
    @submit.prevent="emit('submit')">
    <slot />
    <div class="flex justify-between">
      <ScalarButton
        class="gap-1.5 px-2.5 h-8 shadow-none focus:outline-none flex items-center cursor-pointer"
        type="button"
        variant="outlined"
        @click="emit('cancel')">
        Cancel
      </ScalarButton>
      <ScalarButton
        :class="cx(variants({ danger }))"
        type="submit">
        {{ label ?? 'Save' }}
      </ScalarButton>
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
