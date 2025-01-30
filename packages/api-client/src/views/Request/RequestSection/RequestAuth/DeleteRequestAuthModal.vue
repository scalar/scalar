<script setup lang="ts">
import { useWorkspace } from '@/store/store'
import { ScalarButton, ScalarModal } from '@scalar/components'

const props = defineProps<{
  state: { open: boolean; show: () => void; hide: () => void }
  scheme: { id: string; label: string } | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'delete'): void
}>()

const { securitySchemeMutators } = useWorkspace()

const deleteScheme = () => {
  if (props.scheme?.id) securitySchemeMutators.delete(props.scheme.id)
  emit('delete')
}
</script>
<template>
  <ScalarModal
    size="xxs"
    :state="state"
    title="Delete Security Scheme">
    <p class="mb-4 leading-normal text-c-2 text-sm">
      This cannot be undone. You’re about to delete the
      {{ scheme?.label }} security scheme from the collection.
    </p>
    <div class="flex justify-between gap-2">
      <ScalarButton
        class="gap-1.5 px-3 h-8 shadow-none focus:outline-none flex items-center cursor-pointer"
        type="button"
        variant="outlined"
        @click="emit('close')">
        Cancel
      </ScalarButton>
      <ScalarButton
        class="gap-1.5 px-3 h-8 shadow-none focus:outline-none flex items-center cursor-pointer"
        type="submit"
        @click="deleteScheme">
        Delete {{ scheme?.label }}
      </ScalarButton>
    </div>
  </ScalarModal>
</template>
