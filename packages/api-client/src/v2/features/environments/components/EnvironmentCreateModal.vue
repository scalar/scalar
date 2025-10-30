<script setup lang="ts">
import { ScalarModal, type ModalState } from '@scalar/components'
import type {
  CollectionType,
  WorkspaceEventBus,
} from '@scalar/workspace-store/events'
import type { XScalarEnvironments } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { computed, ref, watch } from 'vue'

import CommandActionForm from '@/components/CommandPalette/CommandActionForm.vue'
import CommandActionInput from '@/components/CommandPalette/CommandActionInput.vue'

import EnvironmentColors from './EnvironmentColors.vue'

const { state, eventBus, type, environments, selectedEnvironmentName } =
  defineProps<
    {
      environments: NonNullable<XScalarEnvironments['x-scalar-environments']>
      selectedEnvironmentName: string | null
      state: ModalState
      eventBus: WorkspaceEventBus
    } & CollectionType
  >()

/** Default color for new environments. */
const DEFAULT_COLOR = '#FFFFFF'

const name = ref('')
const selectedColor = ref(DEFAULT_COLOR)

/** Ensure [re]set the form on open */
watch(
  () => state.open,
  (isOpen) => {
    if (isOpen) {
      const environment = environments[selectedEnvironmentName ?? '']

      // We are editing so lets fill in the form with the existing data
      if (selectedEnvironmentName && environment) {
        name.value = selectedEnvironmentName
        selectedColor.value = environment.color
      }

      // We are adding a new environment so lets clear the form
      else {
        name.value = ''
        selectedColor.value = DEFAULT_COLOR
      }
    }
  },
)

/**
 * Handle color selection from the color picker.
 * Updates the selected color for the new environment.
 */
const handleColorSelect = (color: string): void => {
  selectedColor.value = color
}

/** Emits an event to create the environment with the provided name and color. */
const handleSubmit = (): void => {
  // Editing an existing environment
  if (selectedEnvironmentName) {
    eventBus.emit('environment:upsert:environment', {
      oldEnvironmentName: selectedEnvironmentName,
      payload: {
        color: selectedColor.value,
      },
      environmentName: name.value.trim(),
      type,
    })
  }
  // Adding a new environment
  else {
    eventBus.emit('environment:upsert:environment', {
      environmentName: name.value.trim(),
      payload: {
        color: selectedColor.value,
      },
      type,
    })
  }

  state.hide()
}

/** Check if the environment name is a duplicate */
const isDuplicateName = computed(() => {
  if (selectedEnvironmentName) {
    return (
      name.value !== selectedEnvironmentName &&
      Object.keys(environments).includes(name.value)
    )
  }

  return Object.keys(environments).includes(name.value)
})
</script>

<template>
  <ScalarModal
    bodyClass="border-t-0 rounded-t-lg"
    size="xs"
    :state="state">
    <CommandActionForm
      :disabled="!name.trim() || isDuplicateName"
      @submit="handleSubmit">
      <div class="flex items-start gap-2">
        <!-- Color picker for environment -->
        <EnvironmentColors
          :activeColor="selectedColor"
          class="peer"
          @select="handleColorSelect" />

        <!-- Environment name input, hidden when color selector is expanded -->
        <CommandActionInput
          v-model="name"
          class="-mt-[.5px] !p-0 peer-has-[.color-selector]:hidden"
          placeholder="Environment name" />
      </div>

      <!-- Error message -->
      <div
        v-if="isDuplicateName"
        class="text-red text-xs">
        This environment name is already in use.
      </div>

      <!-- Submit button -->
      <template #submit>
        {{ selectedEnvironmentName ? 'Update' : 'Add' }} Environment
      </template>
    </CommandActionForm>
  </ScalarModal>
</template>
