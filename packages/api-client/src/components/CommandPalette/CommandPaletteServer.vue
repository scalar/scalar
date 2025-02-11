<script setup lang="ts">
import { ScalarButton, ScalarIcon, ScalarListbox } from '@scalar/components'
import { useToasts } from '@scalar/use-toasts'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { PathId } from '@/router'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'

import CommandActionForm from './CommandActionForm.vue'
import CommandActionInput from './CommandActionInput.vue'

const props = defineProps<{
  metaData?: {
    itemUid?: string
    parentUid?: string
  }
}>()

const emits = defineEmits<{
  (event: 'close'): void
  (event: 'back', e: KeyboardEvent): void
}>()

const router = useRouter()

const { toast } = useToasts()

const { activeCollection, activeWorkspaceCollections } = useActiveEntities()
const {
  collectionMutators,
  serverMutators,
  events,
  collections: _collections,
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
const selectedCollection = ref(
  props.metaData
    ? collections.value.find(
        (collection) =>
          collection.id === props.metaData?.itemUid ||
          collection.id === props.metaData?.parentUid,
      )
    : collections.value.find(
        (collection) => collection.id === activeCollection.value?.uid,
      ),
)

const handleSubmit = () => {
  if (!url.value.trim()) {
    toast('Please enter a valid url before creating a server.', 'error')
    return
  }
  const collection = _collections[selectedCollection.value?.id ?? '']
  if (!collection) {
    toast('Please select a collection before creating a server.', 'error')
    return
  }

  const server = serverMutators.add({ url: url.value }, collection.uid)

  // Select the server
  collectionMutators.edit(collection.uid, 'selectedServerUid', server.uid)

  // Redirect to the server
  router.push({
    name: 'collection.servers.edit',
    params: {
      [PathId.Collection]: collection.uid,
      [PathId.Servers]: server.uid,
    },
  })

  emits('close')
}

const redirectToCreateCollection = () => {
  events.commandPalette.emit({ commandName: 'Create Collection' })
}
</script>
<template>
  <CommandActionForm
    :disabled="!url.trim() || !selectedCollection"
    @submit="handleSubmit">
    <CommandActionInput
      v-model="url"
      label="Server URL"
      placeholder="https://void.scalar.com"
      @onDelete="emits('back', $event)" />
    <template #options>
      <ScalarListbox
        v-model="selectedCollection"
        :options="collections">
        <ScalarButton
          v-if="collections.length > 0"
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
        <ScalarButton
          v-else
          class="hover:bg-b-2 max-h-8 w-fit justify-between gap-1 p-2 text-xs"
          variant="outlined"
          @click="redirectToCreateCollection">
          <span class="text-c-1">Create Collection</span>
        </ScalarButton>
      </ScalarListbox>
    </template>
    <template #submit> Create Server </template>
  </CommandActionForm>
</template>
