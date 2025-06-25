<script setup lang="ts">
import { ScalarButton, ScalarModal } from '@scalar/components'
import type { SecurityScheme } from '@scalar/oas-utils/entities/spec'

import { useWorkspace } from '@/store/store'

const props = defineProps<{
  state: { open: boolean; show: () => void; hide: () => void }
  scheme: { id: SecurityScheme['uid']; label: string } | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'delete'): void
}>()

const { securitySchemeMutators } = useWorkspace()

const deleteScheme = () => {
  if (props.scheme?.id) {
    securitySchemeMutators.delete(props.scheme.id)
  }
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
      {{ scheme?.label }} security scheme from the collection.
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
        Delete {{ scheme?.label }}
      </ScalarButton>
    </div>
  </ScalarModal>
</template>
