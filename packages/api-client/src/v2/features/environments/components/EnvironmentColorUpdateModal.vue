<script setup lang="ts">
import { ScalarModal, type ModalState } from '@scalar/components'
import { ref } from 'vue'

import SidebarListElementForm from '@/components/Sidebar/Actions/SidebarListElementForm.vue'

import EnvironmentColors from './EnvironmentColors.vue'

const { color, state } = defineProps<{
  /** Modal visibility and control state */
  state: ModalState
  /** Currently selected color */
  color: string
}>()

const emit = defineEmits<{
  (event: 'cancel'): void
  (event: 'submit', payload: { color: string }): void
}>()

const newColor = ref(color)

const close = () => {
  state.hide()
  newColor.value = ''
}
</script>

<template>
  <ScalarModal
    size="xxs"
    :state="state"
    title="Edit Environment Color"
    @close="
      () => {
        emit('cancel')
        close()
      }
    ">
    <div class="flex flex-col gap-4">
      <EnvironmentColors
        :activeColor="newColor"
        class="w-full p-1"
        @select="(value) => (newColor = value)" />
      <SidebarListElementForm
        @cancel="
          () => {
            emit('cancel')
            close()
          }
        "
        @submit="
          () => {
            emit('submit', { color: newColor })
            close()
          }
        ">
      </SidebarListElementForm>
    </div>
  </ScalarModal>
</template>
