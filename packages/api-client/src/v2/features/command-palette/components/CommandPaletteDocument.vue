<script setup lang="ts">
import { ScalarButton } from '@scalar/components'
import { LibraryIcon } from '@scalar/icons/library'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import IconSelector from '@/components/IconSelector.vue'

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

const router = useRouter()

const collectionName = ref('')
const collectionIcon = ref('interface-content-folder')

const handleSubmit = () => {
  if (!collectionName.value) {
    return
  }

  eventBus.emit('document:create:empty-document', {
    name: collectionName.value,
    icon: collectionIcon.value,
  })

  router.push({
    name: 'document.overview',
    params: {
      documentSlug: collectionName.value,
    },
  })

  emits('close')
}

const isDisabled = computed(() => {
  if (!collectionName.value.trim()) {
    return true
  }

  if (workspaceStore.workspace.documents[collectionName.value] !== undefined) {
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
      v-model="collectionName"
      label="Collection Name"
      placeholder="Collection Name"
      @onDelete="(event) => emits('back', event)" />
    <template #options>
      <IconSelector
        v-model="collectionIcon"
        placement="bottom-start">
        <ScalarButton
          class="aspect-square h-auto px-0"
          variant="outlined">
          <LibraryIcon
            class="text-c-2 size-4 stroke-[1.75]"
            :src="collectionIcon" />
        </ScalarButton>
      </IconSelector>
    </template>
    <template #submit> Create Collection </template>
  </CommandActionForm>
</template>
