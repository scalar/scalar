<script setup lang="ts">
import SidebarListElementForm from '@/components/Sidebar/Actions/SidebarListElementForm.vue'
import {
  type ModalState,
  ScalarModal,
  ScalarTextField,
} from '@scalar/components'
import { ref, watch } from 'vue'

import EnvironmentColors from './EnvironmentColors.vue'

const props = defineProps<{
  state: ModalState
}>()

const emit = defineEmits<{
  (event: 'cancel'): void
  (event: 'submit', environment: { name: string; color: string }): void
}>()

const environmentName = ref('')
const selectedColor = ref('#8E8E8E')

const handleColorSelect = (color: string) => {
  selectedColor.value = color
}

// Reset environment name and selected color
watch(
  () => props.state.open,
  (isOpen) => {
    if (isOpen) {
      environmentName.value = ''
      selectedColor.value = '#8E8E8E'
    }
  },
)
</script>
<template>
  <ScalarModal
    size="xxs"
    :state="state"
    title="Add Environment">
    <div class="flex flex-col gap-3">
      <ScalarTextField
        v-model="environmentName"
        placeholder="Environment name" />
      <EnvironmentColors
        :activeColor="selectedColor"
        class="p-3 w-full"
        @select="handleColorSelect" />
      <SidebarListElementForm
        @cancel="emit('cancel')"
        @submit="
          emit('submit', {
            name: environmentName,
            color: selectedColor,
          })
        ">
      </SidebarListElementForm>
    </div>
  </ScalarModal>
</template>
