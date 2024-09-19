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
}>()

const { toast } = useToasts()

const {
  activeCollection,
  activeWorkspaceCollections,
  collectionMutators,
  serverMutators,
} = useWorkspace()

const url = ref('')

const collections = computed(() =>
  activeWorkspaceCollections.value.flatMap((collection) =>
    collection.info?.title === 'Drafts'
      ? []
      : {
          id: collection.uid,
          label: collection.info?.title ?? 'Unititled Collection',
        },
  ),
)

/** Currently selected collection with a reasonable default */
const selectedCollection = ref<ScalarComboboxOption | undefined>(
  collections.value.find(
    (collection) => collection.id === activeCollection.value?.uid,
  ),
)

const handleSubmit = () => {
  if (!url.value.trim()) {
    toast('Please enter a valid url before creating a server.', 'error')
    return
  }
  const collectionUid = selectedCollection.value?.id
  if (!collectionUid) return

  const server = serverMutators.add({ url: url.value }, collectionUid)

  // Select the server
  collectionMutators.edit(collectionUid, 'selectedServerUid', server.uid)

  emits('close')
}
</script>
<template>
  <CommandActionForm
    :disabled="!url.trim()"
    @submit="handleSubmit">
    <CommandActionInput
      v-model="url"
      label="Server URL"
      placeholder="Server URL" />
    <template #options>
      <ScalarListbox
        v-model="selectedCollection"
        :options="collections">
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
    <template #submit>Create Server</template>
  </CommandActionForm>
</template>
