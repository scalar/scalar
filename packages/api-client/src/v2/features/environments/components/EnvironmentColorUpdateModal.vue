<script setup lang="ts">
import { ScalarModal, type ModalState } from '@scalar/components'
import { ref, watch } from 'vue'

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

// Need to use a watcher here because we use the same modal instance for different environments
watch(
  () => color,
  (newVal) => {
    newColor.value = newVal
  },
)

const close = (event?: 'cancel' | 'submit') => {
  state.hide()

  if (event === 'cancel') {
    emit('cancel')
  }

  if (event === 'submit') {
    emit('submit', { color: newColor.value })
  }
}
</script>

<template>
  <ScalarModal
    size="xxs"
    :state="state"
    title="Edit Environment Color"
    @close="() => close('cancel')">
    <div class="flex flex-col gap-4">
      <EnvironmentColors
        :activeColor="newColor"
        class="w-full p-1"
        @select="(value) => (newColor = value)" />
      <SidebarListElementForm
        @cancel="() => close('cancel')"
        @submit="() => close('submit')">
      </SidebarListElementForm>
    </div>
  </ScalarModal>
</template>
