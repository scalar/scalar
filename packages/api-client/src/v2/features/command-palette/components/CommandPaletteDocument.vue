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

const documentName = ref('')
const documentIcon = ref('interface-content-folder')

const handleSubmit = () => {
  if (!documentName.value) {
    return
  }

  eventBus.emit('document:create:empty-document', {
    name: documentName.value,
    icon: documentIcon.value,
  })

  router.push({
    name: 'document.overview',
    params: {
      documentSlug: documentName.value,
    },
  })

  emits('close')
}

const isDisabled = computed(() => {
  if (!documentName.value.trim()) {
    return true
  }

  if (workspaceStore.workspace.documents[documentName.value] !== undefined) {
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
      v-model="documentName"
      label="Document Name"
      placeholder="Document Name"
      @onDelete="(event) => emits('back', event)" />
    <template #options>
      <IconSelector
        v-model="documentIcon"
        placement="bottom-start">
        <ScalarButton
          class="aspect-square h-auto px-0"
          variant="outlined">
          <LibraryIcon
            class="text-c-2 size-4 stroke-[1.75]"
            :src="documentIcon" />
        </ScalarButton>
      </IconSelector>
    </template>
    <template #submit> Create Document </template>
  </CommandActionForm>
</template>
