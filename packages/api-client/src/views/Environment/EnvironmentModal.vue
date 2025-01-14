<script setup lang="ts">
import CommandActionForm from '@/components/CommandPalette/CommandActionForm.vue'
import CommandActionInput from '@/components/CommandPalette/CommandActionInput.vue'
import { useWorkspace } from '@/store'
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
  collectionId?: string
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

const { events } = useWorkspace()

const environmentName = ref('')
const selectedColor = ref('#8E8E8E')

const collections = computed(() => [
  ...props.activeWorkspaceCollections
    .filter((collection) => collection.info?.title !== 'Drafts')
    .map((collection) => ({
      id: collection.uid,
      label: collection.info?.title ?? 'Untitled Collection',
    })),
])

const selectedEnvironment = ref<ScalarComboboxOption | undefined>(
  collections.value.find((collection) => collection.id === props.collectionId),
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
      if (props.collectionId) {
        selectedEnvironment.value = collections.value.find(
          (collection) => collection.id === props.collectionId,
        )
      } else {
        selectedEnvironment.value = undefined
      }
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

const redirectToCreateCollection = () => {
  props.state.hide()
  events.commandPalette.emit({ commandName: 'Create Collection' })
}
</script>

<template>
  <ScalarModal
    bodyClass="border-t-0 rounded-t-lg"
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
              selectedEnvironment
                ? selectedEnvironment.label
                : 'Select Collection'
            }}</span>
            <ScalarIcon
              class="text-c-3"
              icon="ChevronDown"
              size="xs" />
          </ScalarButton>
          <ScalarButton
            v-else
            class="justify-between p-2 max-h-8 gap-1 text-xs hover:bg-b-2"
            variant="outlined"
            @click="redirectToCreateCollection">
            <span class="text-c-1">Create Collection</span>
          </ScalarButton>
        </ScalarListbox>
      </template>
      <template #submit>Add Environment</template>
    </CommandActionForm>
  </ScalarModal>
</template>
