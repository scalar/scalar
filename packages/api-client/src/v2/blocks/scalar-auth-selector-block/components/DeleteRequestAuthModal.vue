<script setup lang="ts">
import { ScalarButton, ScalarModal } from '@scalar/components'

defineProps<{
  state: { open: boolean; show: () => void; hide: () => void }
  label: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'delete'): void
}>()

const deleteScheme = () => {
  emit('delete')
}
</script>
<template>
  <ScalarModal
    size="xxs"
    :state="state"
    title="Delete Security Scheme">
    <p class="text-c-2 mb-4 text-sm leading-normal">
      This cannot be undone. You're about to delete the
      {{ label }} security scheme from the collection.
    </p>
    <div class="flex justify-between gap-2">
      <ScalarButton
        class="flex h-8 cursor-pointer items-center gap-1.5 px-3 shadow-none focus:outline-none"
        type="button"
        variant="outlined"
        @click="emit('close')">
        Cancel
      </ScalarButton>
      <ScalarButton
        class="flex h-8 cursor-pointer items-center gap-1.5 px-3 shadow-none focus:outline-none"
        type="submit"
        @click="deleteScheme">
        Delete {{ label }}
      </ScalarButton>
    </div>
  </ScalarModal>
</template>
