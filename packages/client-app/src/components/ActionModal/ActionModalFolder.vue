<script setup lang="ts">
import Folder from '@/assets/ascii/folder.ascii?raw'
import ScalarAsciiArt from '@/components/ScalarAsciiArt.vue'
import { useWorkspace } from '@/store/workspace'
import { ScalarButton, ScalarIcon, ScalarListbox } from '@scalar/components'
import { computed, ref } from 'vue'

defineProps<{
  title: string
}>()

const emits = defineEmits<{
  (event: 'close'): void
}>()

const { collectionMutators, workspace } = useWorkspace()
const folderName = ref('')
const selectedCollectionId = ref('')

const availableCollections = computed(() => {
  return workspace.collections.map((collection) => ({
    id: collection.uid,
    label: collection.spec?.info?.title ?? '',
  }))
})

const selectedCollection = computed({
  get: () =>
    availableCollections.value.find(
      ({ id }) => id === selectedCollectionId.value,
    ),
  set: (opt) => {
    if (opt?.id) selectedCollectionId.value = opt.id
  },
})

const handleSubmit = () => {
  if (folderName.value && selectedCollection.value) {
    const collectionIdx = workspace.collections.findIndex(
      (collection) => collection.uid === selectedCollectionId.value,
    )
    if (collectionIdx !== -1) {
      collectionMutators.addFolder(collectionIdx, null, {
        name: folderName.value,
      })
      emits('close')
    }
  }
}
</script>
<template>
  <ScalarAsciiArt :art="Folder" />
  <h2>{{ title }}</h2>
  <form
    class="flex w-full flex-col gap-3"
    @submit.prevent="handleSubmit">
    <input
      v-model="folderName"
      class="h-10 rounded border p-2"
      label="Folder Name"
      placeholder="Folder Name" />
    <div>
      <span class="mb-1 block font-medium">Inside:</span>
      <ScalarListbox
        v-model="selectedCollection"
        :options="availableCollections"
        resize>
        <button
          class="relative flex h-full min-h-10 w-full cursor-pointer items-center justify-between rounded border p-2"
          type="button">
          <span :class="selectedCollection ? 'text-c-1' : 'text-c-3'">{{
            selectedCollection ? selectedCollection.label : 'Select Collection'
          }}</span>
          <ScalarIcon
            icon="ChevronDown"
            size="xs" />
        </button>
      </ScalarListbox>
    </div>
    <ScalarButton type="submit"> Create Folder </ScalarButton>
  </form>
</template>
