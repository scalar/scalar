<script setup lang="ts">
import LabelInput from '@/components/Form/LabelInput.vue'
import IconSelector from '@/components/IconSelector.vue'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import MarkdownInput from '@/views/Collection/components/MarkdownInput.vue'
import { ScalarButton } from '@scalar/components'
import { LibraryIcon } from '@scalar/icons'
import { computed } from 'vue'

const { activeCollection } = useActiveEntities()
const { collectionMutators } = useWorkspace()

const icon = computed(
  () =>
    activeCollection?.value?.['x-scalar-icon'] || 'interface-content-folder',
)

const updateCollectionIcon = (value: string) => {
  if (!activeCollection?.value?.uid) {
    return
  }

  collectionMutators.edit(activeCollection?.value?.uid, 'x-scalar-icon', value)
}

/**
 * Update info.title
 */
const updateCollectionTitle = (value: string) => {
  if (!activeCollection.value) return

  collectionMutators.edit(activeCollection.value.uid, 'info.title', value)
}

/**
 * Update info.description
 */
const updateCollectionDescription = (value: string) => {
  if (!activeCollection.value) return

  collectionMutators.edit(activeCollection.value.uid, 'info.description', value)
}

/**
 * Alias for the data that we’d like to display.
 */
const data = computed(() => {
  return {
    icon: activeCollection?.value?.['x-scalar-icon'],
    title: activeCollection?.value?.info?.title,
    description: activeCollection?.value?.info?.description,
    version: activeCollection?.value?.info?.version,
  }
})
</script>

<template>
  <div
    :aria-label="`Collection: ${data.title}`"
    class="flex flex-col gap-2 h-full mx-auto py-6 w-full md:max-h-[82dvh] md:max-w-[50dvw]">
    <div class="relative">
      <IconSelector
        :modelValue="icon"
        placement="bottom-start"
        @update:modelValue="(value) => updateCollectionIcon(value)">
        <ScalarButton
          class="absolute cursor-pointer -left-6 top-1/2 -translate-y-1/2 h-6 w-6 aspect-square p-0.25 rounded hover:bg-b-2"
          variant="ghost">
          <LibraryIcon
            class="size-4 text-c-2 stroke-[1.75]"
            :src="icon" />
        </ScalarButton>
      </IconSelector>
      <div class="group ml-1.25">
        <LabelInput
          inputId="collectionName"
          placeholder="Untitled Collection"
          :value="data.title"
          @updateValue="updateCollectionTitle" />
      </div>
    </div>
    <MarkdownInput
      :modelValue="data.description ?? ''"
      @update:modelValue="updateCollectionDescription" />
  </div>
</template>

<style scoped>
:deep(.markdown) h2 {
  @apply text-lg;
}
</style>
