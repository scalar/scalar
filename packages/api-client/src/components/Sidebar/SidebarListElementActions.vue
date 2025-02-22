<script setup lang="ts">
import { ScalarIcon, ScalarModal, useModal } from '@scalar/components'
import { useClipboard } from '@scalar/use-hooks/useClipboard'
import { ref } from 'vue'

import DeleteSidebarListElement from '@/components/Sidebar/Actions/DeleteSidebarListElement.vue'

const { variable } = defineProps<{
  variable: {
    uid: string
    name: string
    isDefault: boolean
  }
  warningMessage: string | undefined
  isCopyable?: boolean
  isDeletable?: boolean
  isRenameable?: boolean
}>()

const emit = defineEmits<{
  (e: 'delete', id: string): void
  (e: 'rename', id: string): void
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
  <div class="absolute right-1 flex opacity-0 group-hover:opacity-100">
    <button
      v-if="isCopyable"
      class="text-c-3 hover:bg-b-3 hover:text-c-1 rounded p-[5px]"
      type="button"
      @click="copyToClipboard(variable.name)">
      <ScalarIcon
        class="h-3 w-3"
        icon="Clipboard" />
    </button>
    <button
      v-if="isRenameable"
      class="text-c-3 hover:bg-b-3 hover:text-c-1 rounded p-[5px]"
      type="button"
      @click="emit('rename', variable.uid)">
      <ScalarIcon
        class="h-3 w-3"
        icon="Edit" />
    </button>
    <button
      v-if="!variable.isDefault && isDeletable"
      class="text-c-3 hover:bg-b-3 hover:text-c-1 rounded p-1"
      type="button"
      @click.prevent="startActionFlow(ModalAction.Delete)">
      <ScalarIcon
        class="h-3.5 w-3.5"
        icon="Close" />
    </button>
  </div>
  <ScalarModal
    size="sm"
    :state="modalState"
    :title="`${currentAction.action} ${currentAction.name}`">
    <DeleteSidebarListElement
      v-if="currentAction.action === ModalAction.Delete"
      :variableName="currentAction.name"
      :warningMessage="warningMessage"
      @close="handleModalClose"
      @delete="handleDelete(variable.uid)" />
  </ScalarModal>
</template>
