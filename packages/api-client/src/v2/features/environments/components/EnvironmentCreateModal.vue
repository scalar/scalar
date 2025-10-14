<script setup lang="ts">
import { ScalarModal, type ModalState } from '@scalar/components'
import { ref } from 'vue'

import CommandActionForm from '@/components/CommandPalette/CommandActionForm.vue'
import CommandActionInput from '@/components/CommandPalette/CommandActionInput.vue'

import EnvironmentColors from './EnvironmentColors.vue'

const { state } = defineProps<{
  state: ModalState
}>()

const emit = defineEmits<{
  (event: 'cancel'): void
  (
    event: 'submit',
    environment: {
      name: string
      color: string
    },
  ): void
}>()

const environmentName = ref('')
const selectedColor = ref('#FFFFFF')

const clearState = () => {
  environmentName.value = ''
  selectedColor.value = '#FFFFFF'
}

const handleCancel = () => {
  emit('cancel')
  clearState()
}

const handleSubmit = () => {
  if (!environmentName.value.trim()) {
    return
  }
  emit('submit', {
    name: environmentName.value.trim(),
    color: selectedColor.value,
  })
  clearState()
  state.hide()
}
</script>

<template>
  <ScalarModal
    bodyClass="border-t-0 rounded-t-lg"
    size="xs"
    :state="state"
    @close="handleCancel">
    <CommandActionForm
      :disabled="!environmentName.trim()"
      @cancel="handleCancel"
      @submit="handleSubmit">
      <div class="flex items-start gap-2">
        <EnvironmentColors
          :activeColor="selectedColor"
          class="peer"
          selector
          @select="(color) => (selectedColor = color)" />
        <CommandActionInput
          v-model="environmentName"
          class="-mt-[.5px] !p-0 peer-has-[.color-selector]:hidden"
          placeholder="Environment name" />
      </div>
      <template #submit>Add Environment</template>
    </CommandActionForm>
  </ScalarModal>
</template>
