<script setup lang="ts">
import DeleteSidebarListElement from '@/components/Sidebar/Actions/DeleteSidebarListElement.vue'
import { useClipboard } from '@/hooks'
import { ScalarIcon, ScalarModal, useModal } from '@scalar/components'
import { ref } from 'vue'

const { variable } = defineProps<{
  variable: {
    uid: string
    name: string
    isDefault: boolean
  }
}>()

const emit = defineEmits<{
  (e: 'delete', id: string): void
}>()

enum ModalAction {
  Delete = 'Delete',
  None = 'None',
}

const currentAction = ref({ action: ModalAction.None, name: '' })

const modalState = useModal()
const { copyToClipboard } = useClipboard()

function startActionFlow(action: ModalAction) {
  currentAction.value = { action, name: variable.name }
  modalState.show()
}

function handleModalClose() {
  modalState.hide()
  currentAction.value = { action: ModalAction.None, name: '' }
}

function handleDelete(id: string) {
  emit('delete', id)
  handleModalClose()
}
</script>
<template>
  <div class="absolute right-1 opacity-0 group-hover:opacity-100">
    <button
      class="text-c-3 hover:bg-b-3 hover:text-c-1 rounded p-1.5"
      type="button"
      @click="copyToClipboard(variable.name)">
      <ScalarIcon
        class="h-2.5 w-2.5"
        icon="Clipboard" />
    </button>
    <button
      v-if="!variable.isDefault"
      class="text-c-3 hover:bg-b-3 hover:text-c-1 rounded p-1.5"
      type="button"
      @click.prevent="startActionFlow(ModalAction.Delete)">
      <ScalarIcon
        class="h-2.5 w-2.5"
        icon="Close" />
    </button>
  </div>
  <ScalarModal
    :state="modalState"
    :title="`${currentAction.action} ${currentAction.name}`">
    <DeleteSidebarListElement
      v-if="currentAction.action === ModalAction.Delete"
      :variableName="currentAction.name"
      @close="handleModalClose"
      @delete="handleDelete(variable.uid)" />
  </ScalarModal>
</template>
