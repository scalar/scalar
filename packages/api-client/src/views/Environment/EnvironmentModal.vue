<script setup lang="ts">
import CommandActionForm from '@/components/CommandPalette/CommandActionForm.vue'
import CommandActionInput from '@/components/CommandPalette/CommandActionInput.vue'
import {
  type ModalState,
  ScalarButton,
  type ScalarComboboxOption,
  ScalarIcon,
  ScalarListbox,
  ScalarModal,
} from '@scalar/components'
import type { Collection } from '@scalar/oas-utils/entities/spec'
import { useToasts } from '@scalar/use-toasts'
import { computed, ref, watch } from 'vue'

import EnvironmentColors from './EnvironmentColors.vue'

const props = defineProps<{
  state: ModalState
  activeWorkspaceCollections: Collection[]
}>()

const emit = defineEmits<{
  (event: 'cancel'): void
  (
    event: 'submit',
    environment: {
      name: string
      color: string
      type: string
      collectionId?: string
    },
  ): void
}>()

const environmentName = ref('')
const selectedColor = ref('#8E8E8E')
const environmentType = ref<ScalarComboboxOption | undefined>()

const collections = computed(() => [
  { id: 'global', label: 'Global' },
  ...props.activeWorkspaceCollections
    .filter((collection) => collection.info?.title !== 'Drafts')
    .map((collection) => ({
      id: collection.uid,
      label: collection.info?.title ?? 'Untitled Collection',
    })),
])

const selectedEnvironment = ref<ScalarComboboxOption | undefined>(
  collections.value.find(
    (collection) => collection.id === environmentType.value?.id,
  ),
)

const { toast } = useToasts()

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
      environmentType.value = undefined
      selectedEnvironment.value = undefined
    }
  },
)

const handleSubmit = () => {
  if (!selectedEnvironment.value?.id) {
    toast('Please select a collection before adding an environment.', 'error')
    return
  }
  emit('submit', {
    name: environmentName.value,
    color: selectedColor.value,
    type: selectedEnvironment.value?.id === 'global' ? 'global' : 'collection',
    collectionId:
      selectedEnvironment.value?.id !== 'global'
        ? selectedEnvironment.value?.id
        : undefined,
  })
}
</script>

<template>
  <ScalarModal
    bodyClass="!border-t-0 !rounded-t-lg"
    size="xs"
    :state="state">
    <CommandActionForm
      :disabled="!selectedEnvironment"
      @cancel="emit('cancel')"
      @submit="handleSubmit">
      <div class="flex gap-2 items-start">
        <EnvironmentColors
          :activeColor="selectedColor"
          class="peer"
          selector
          @select="handleColorSelect" />
        <CommandActionInput
          v-model="environmentName"
          class="!p-0 peer-has-[.color-selector]:hidden -mt-[.5px]"
          placeholder="Environment name" />
      </div>
      <template #options>
        <ScalarListbox
          v-model="selectedEnvironment"
          :options="collections"
          placeholder="Select Type">
          <ScalarButton
            v-if="collections.length > 0"
            class="justify-between p-2 max-h-8 w-full gap-1 text-xs hover:bg-b-2 w-fit"
            variant="outlined">
            <span :class="selectedEnvironment ? 'text-c-1' : 'text-c-3'">{{
              selectedEnvironment ? selectedEnvironment.label : 'Select Scope'
            }}</span>
            <ScalarIcon
              class="text-c-3"
              icon="ChevronDown"
              size="xs" />
          </ScalarButton>
        </ScalarListbox>
      </template>
      <template #submit>Add Environment</template>
    </CommandActionForm>
  </ScalarModal>
</template>
