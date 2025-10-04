<script setup lang="ts">
import {
  ScalarButton,
  ScalarIcon,
  ScalarListbox,
  ScalarModal,
  type ModalState,
} from '@scalar/components'
import type { Collection } from '@scalar/oas-utils/entities/spec'
import { useToasts } from '@scalar/use-toasts'
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  state: ModalState
  activeWorkspaceCollections: Collection[]
  collectionId: string | undefined
}>()

const emit = defineEmits<{
  (event: 'cancel'): void
  (
    event: 'submit',
    environment: {
      name: string
      color: string
      type: string
      collectionId: Collection['uid'] | undefined
    },
  ): void
}>()

const environmentName = ref('')
const selectedColor = ref('#069061')

/**
 * Available color options for environments
 */
const colorOptions = [
  '#FFFFFF',
  '#EF0006',
  '#EDBE20',
  '#069061',
  '#FB892C',
  '#0082D0',
  '#5203D1',
  '#FFC0CB',
]

const collections = computed(() => [
  ...props.activeWorkspaceCollections
    .filter((collection) => collection.info?.title !== 'Drafts')
    .map((collection) => ({
      id: collection.uid,
      label: collection.info?.title ?? 'Untitled Collection',
    })),
])

const selectedEnvironment = ref(
  collections.value.find((collection) => collection.id === props.collectionId),
)

const { toast } = useToasts()

/**
 * Handle color selection
 */
function handleColorSelect(color: string): void {
  selectedColor.value = color
}

/**
 * Reset environment name and selected color when modal opens
 */
watch(
  () => props.state.open,
  (isOpen) => {
    if (isOpen) {
      environmentName.value = ''
      selectedColor.value = '#069061'
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

/**
 * Handle form submission
 */
function handleSubmit(): void {
  if (!environmentName.value.trim()) {
    toast('Please enter a name before adding an environment.', 'error')
    return
  }
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
    size="xs"
    :state="state"
    @cancel="emit('cancel')">
    <div class="p-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Create Environment
      </h3>
      
      <form
        @submit.prevent="handleSubmit">
        <!-- Environment Name -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Environment Name
          </label>
          <input
            v-model="environmentName"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Production, Staging"
            type="text" />
        </div>

        <!-- Color Picker -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Color
          </label>
          <div class="flex gap-2">
            <button
              v-for="color in colorOptions"
              :key="color"
              class="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all"
              :class="
                selectedColor === color
                  ? 'border-gray-900 dark:border-white scale-110'
                  : 'border-gray-200 dark:border-gray-700 hover:scale-105'
              "
              :style="{ backgroundColor: color }"
              type="button"
              @click="handleColorSelect(color)">
              <ScalarIcon
                v-if="selectedColor === color"
                class="text-white"
                icon="Checkmark"
                size="xs" />
            </button>
          </div>
        </div>

        <!-- Collection Selector -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Collection
          </label>
          <ScalarListbox
            v-model="selectedEnvironment"
            :options="collections"
            placeholder="Select Collection">
            <ScalarButton
              v-if="collections.length > 0"
              class="w-full justify-between"
              variant="outlined">
              <span :class="selectedEnvironment ? 'text-c-1' : 'text-c-3'">
                {{
                  selectedEnvironment
                    ? selectedEnvironment.label
                    : 'Select Collection'
                }}
              </span>
              <ScalarIcon
                class="text-c-3"
                icon="ChevronDown"
                size="xs" />
            </ScalarButton>
            <ScalarButton
              v-else
              class="w-full"
              disabled
              variant="outlined">
              <span class="text-c-3">No collections available</span>
            </ScalarButton>
          </ScalarListbox>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3">
          <ScalarButton
            variant="outlined"
            @click="emit('cancel')">
            Cancel
          </ScalarButton>
          <ScalarButton
            :disabled="!selectedEnvironment || !environmentName.trim()"
            type="submit">
            Add Environment
          </ScalarButton>
        </div>
      </form>
    </div>
  </ScalarModal>
</template>

