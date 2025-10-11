<script setup lang="ts">
import { ScalarModal, type ModalState } from '@scalar/components'

import EditSidebarListElement from '@/components/Sidebar/Actions/EditSidebarListElement.vue'

defineProps<{
  state: ModalState
  name: string
}>()

const emit = defineEmits<{
  (event: 'cancel'): void
  (event: 'submit', payload: { name: string }): void
}>()
</script>

<template>
  <ScalarModal
    :size="'xxs'"
    :state="state"
    :title="`Edit ${name}`">
    <EditSidebarListElement
      :name="name"
      @close="
        () => {
          emit('cancel')
          state.hide()
        }
      "
      @edit="
        (value) => {
          emit('submit', { name: value })
          state.hide()
        }
      " />
  </ScalarModal>
</template>
