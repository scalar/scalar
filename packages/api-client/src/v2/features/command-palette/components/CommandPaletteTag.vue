<script setup lang="ts">
import { ScalarButton, ScalarIcon, ScalarListbox } from '@scalar/components'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { computed, ref } from 'vue'

import CommandActionForm from './CommandActionForm.vue'
import CommandActionInput from './CommandActionInput.vue'

const { workspaceStore, eventBus } = defineProps<{
  workspaceStore: WorkspaceStore
  eventBus: WorkspaceEventBus
}>()

const emits = defineEmits<{
  (event: 'close'): void
  (event: 'back', e: KeyboardEvent): void
}>()

const availableCollections = computed(() =>
  Object.entries(workspaceStore.workspace.documents).map(
    ([name, document]) => ({
      id: name,
      label: document.info.title || name,
    }),
  ),
)

const name = ref('')
const selectedCollection = ref(availableCollections.value[0] ?? undefined)

const handleSubmit = () => {
  if (!name.value) {
    return
  }

  if (!name.value || !selectedCollection.value) {
    return
  }

  // TODO: make sure the tag name is not already taken
  eventBus.emit('tag:create:tag', {
    name: name.value,
    documentName: selectedCollection.value.id,
  })

  emits('close')
}

const isDisabled = computed(() => {
  if (!name.value.trim()) {
    return true
  }

  if (!selectedCollection.value) {
    return true
  }

  const document =
    workspaceStore.workspace.documents[selectedCollection.value.id]

  if (!document) {
    return true
  }

  if (document.tags?.some((tag) => tag.name === name.value.trim())) {
    return true
  }

  return false
})
</script>
<template>
  <CommandActionForm
    :disabled="isDisabled"
    @submit="handleSubmit">
    <CommandActionInput
      v-model="name"
      label="Tag Name"
      placeholder="Tag Name"
      @onDelete="emits('back', $event)" />
    <template #options>
      <ScalarListbox
        v-model="selectedCollection"
        :options="availableCollections">
        <ScalarButton
          class="hover:bg-b-2 max-h-8 w-fit justify-between gap-1 p-2 text-xs"
          variant="outlined">
          <span :class="selectedCollection ? 'text-c-1' : 'text-c-3'">{{
            selectedCollection ? selectedCollection.label : 'Select Collection'
          }}</span>
          <ScalarIcon
            class="text-c-3"
            icon="ChevronDown"
            size="md" />
        </ScalarButton>
      </ScalarListbox>
    </template>
    <template #submit> Create Tag </template>
  </CommandActionForm>
</template>
