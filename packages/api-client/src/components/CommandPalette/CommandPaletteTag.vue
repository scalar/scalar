<script setup lang="ts">
import { useWorkspace } from '@/store'
import {
  ScalarButton,
  type ScalarComboboxOption,
  ScalarIcon,
  ScalarListbox,
} from '@scalar/components'
import { useToasts } from '@scalar/use-toasts'
import { computed, ref } from 'vue'

import CommandActionForm from './CommandActionForm.vue'
import CommandActionInput from './CommandActionInput.vue'

const emits = defineEmits<{
  (event: 'close'): void
  (event: 'back', e: KeyboardEvent): void
}>()

const { activeWorkspaceCollections, activeCollection, tagMutators } =
  useWorkspace()
const { toast } = useToasts()

const availableCollections = computed(() =>
  activeWorkspaceCollections.value.map((collection) => ({
    id: collection.uid,
    label: collection.info?.title ?? '',
  })),
)

const name = ref('')
const selectedCollection = ref<ScalarComboboxOption | undefined>(
  availableCollections.value.find(
    (option) => option.id === activeCollection.value?.uid,
  ),
)

const handleSubmit = () => {
  if (!name.value) {
    toast('Please enter a name before creating a tag.', 'error')
    return
  }
  if (!name.value || !selectedCollection.value) return

  const tag = tagMutators.add(
    {
      name: name.value,
    },
    selectedCollection.value.id,
  )
  if (tag) emits('close')
}
</script>
<template>
  <CommandActionForm
    :disabled="!name.trim()"
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
          class="justify-between p-2 max-h-8 w-full gap-1 text-xs hover:bg-b-2"
          variant="outlined">
          <span :class="selectedCollection ? 'text-c-1' : 'text-c-3'">{{
            selectedCollection ? selectedCollection.label : 'Select Collection'
          }}</span>
          <ScalarIcon
            class="text-c-3"
            icon="ChevronDown"
            size="xs" />
        </ScalarButton>
      </ScalarListbox>
    </template>
    <template #submit>Create Tag</template>
  </CommandActionForm>
</template>
