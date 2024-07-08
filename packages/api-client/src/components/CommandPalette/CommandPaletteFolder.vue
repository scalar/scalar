<script setup lang="ts">
import { useWorkspace } from '@/store/workspace'
import { ScalarButton, ScalarIcon, ScalarListbox } from '@scalar/components'
import { computed, ref } from 'vue'

defineProps<{
  title: string
}>()

const emits = defineEmits<{
  (event: 'close'): void
}>()

const { collections, folderMutators } = useWorkspace()
const folderName = ref('')
const selectedCollectionId = ref('')

const availableCollections = computed(() =>
  Object.values(collections).map((collection) => ({
    id: collection.uid,
    label: collection.spec?.info?.title ?? '',
  })),
)

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
    folderMutators.add(
      {
        name: folderName.value,
      },
      selectedCollectionId.value,
    )
    emits('close')
  }
}
</script>
<template>
  <h2>{{ title }}</h2>
  <form
    class="flex w-full flex-col gap-3"
    @submit.prevent="handleSubmit">
    <div
      class="gap-3 rounded bg-b-2 focus-within:bg-b-1 focus-within:shadow-border min-h-20 relative">
      <label
        class="absolute w-full h-full opacity-0 cursor-text"
        for="foldername"></label>
      <input
        id="foldername"
        v-model="folderName"
        class="border-transparent outline-none w-full pl-8 text-sm min-h-8 py-1.5"
        label="Folder Name"
        placeholder="Folder Name" />
    </div>
    <div class="flex">
      <div class="flex flex-1 gap-2 max-h-8">
        <ScalarListbox
          v-model="selectedCollection"
          :options="availableCollections">
          <ScalarButton
            class="justify-between p-2 max-h-8 w-full gap-1 text-xs hover:bg-b-2"
            variant="outlined">
            <span :class="selectedCollection ? 'text-c-1' : 'text-c-3'">{{
              selectedCollection
                ? selectedCollection.label
                : 'Select Collection'
            }}</span>
            <ScalarIcon
              class="text-c-3"
              icon="ChevronDown"
              size="xs" />
          </ScalarButton>
        </ScalarListbox>
      </div>
      <ScalarButton
        class="max-h-8 text-xs p-0 px-3"
        type="submit">
        Create Folder
      </ScalarButton>
    </div>
  </form>
</template>
