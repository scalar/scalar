<script setup lang="ts">
import { ScalarButton } from '@scalar/components'
import { LibraryIcon } from '@scalar/icons/library'
import { computed } from 'vue'

import LabelInput from '@/components/Form/LabelInput.vue'
import IconSelector from '@/components/IconSelector.vue'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'

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
  if (!activeCollection.value) {
    return
  }

  collectionMutators.edit(activeCollection.value.uid, 'info.title', value)
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
    class="mx-auto flex h-fit w-full flex-col gap-2 pb-3 pt-6 md:mx-auto md:max-w-[720px]">
    <IconSelector
      :modelValue="icon"
      placement="bottom-start"
      @update:modelValue="(value) => updateCollectionIcon(value)">
      <ScalarButton
        class="hover:bg-b-2 aspect-square h-7 w-7 cursor-pointer rounded border border-transparent p-0 hover:border-inherit"
        variant="ghost">
        <LibraryIcon
          class="text-c-2 size-5"
          :src="icon"
          stroke-width="2" />
      </ScalarButton>
    </IconSelector>
    <div class="ml-1.25 group relative">
      <LabelInput
        class="text-xl font-bold"
        inputId="collectionName"
        placeholder="Untitled Collection"
        :value="data.title"
        @updateValue="updateCollectionTitle" />
    </div>
  </div>
</template>

<style scoped>
:deep(.markdown) h2 {
  @apply text-lg;
}
</style>
