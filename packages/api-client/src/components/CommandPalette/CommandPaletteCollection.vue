<script setup lang="ts">
import { ScalarButton } from '@scalar/components'
import { LibraryIcon } from '@scalar/icons/library'
import { useToasts } from '@scalar/use-toasts'
import { ref } from 'vue'

import IconSelector from '@/components/IconSelector.vue'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'

import CommandActionForm from './CommandActionForm.vue'
import CommandActionInput from './CommandActionInput.vue'

const emits = defineEmits<{
  (event: 'close'): void
  (event: 'back', e: KeyboardEvent): void
}>()

const { activeWorkspace } = useActiveEntities()
const { collectionMutators } = useWorkspace()
const collectionName = ref('')
const collectionIcon = ref('interface-content-folder')
const { toast } = useToasts()

const handleSubmit = () => {
  if (!collectionName.value) {
    toast('Please enter a name before creating a collection.', 'error')
    return
  }
  if (!activeWorkspace.value?.uid) {
    toast('No active workspace found.', 'error')
    return
  }

  collectionMutators.add(
    {
      'openapi': '3.1.0',
      'info': {
        title: collectionName.value,
        version: '0.0.1',
      },
      'x-scalar-icon': collectionIcon.value,
    },
    activeWorkspace.value?.uid,
  )
  emits('close')
}
</script>
<template>
  <CommandActionForm
    :disabled="!collectionName.trim()"
    @submit="handleSubmit">
    <CommandActionInput
      v-model="collectionName"
      label="Collection Name"
      placeholder="Collection Name"
      @onDelete="emits('back', $event)" />
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
