<script setup lang="ts">
import { ScalarModal, type ModalState } from '@scalar/components'
import { ref } from 'vue'

import SidebarListElementForm from '@/components/Sidebar/Actions/SidebarListElementForm.vue'

import EnvironmentColors from './EnvironmentColors.vue'

const props = defineProps<{
  state: ModalState
  selectedColor: string
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'submit', color: string): void
}>()

const newColor = ref('')

const handleColorSelect = (color: string) => {
  newColor.value = color
}

const handleSubmit = () => {
  emit('submit', newColor.value)
  newColor.value = ''
}
</script>
<template>
  <ScalarModal
    size="xxs"
    :state="state"
    title="Edit Environment Color">
    <div class="flex flex-col gap-4">
      <EnvironmentColors
        :activeColor="newColor || props.selectedColor"
        class="w-full p-1"
        @select="handleColorSelect" />
      <SidebarListElementForm
        @cancel="emit('cancel')"
        @submit="handleSubmit">
      </SidebarListElementForm>
    </div>
  </ScalarModal>
</template>
