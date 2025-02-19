<script setup lang="ts">
import { ScalarButton } from '@scalar/components'
import { LibraryIcon } from '@scalar/icons'
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
  if (!activeCollection.value) return

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
    class="mx-auto flex h-fit w-full flex-col gap-2 pb-3 pt-6">
    <div class="relative">
      <IconSelector
        :modelValue="icon"
        placement="bottom-start"
        @update:modelValue="(value) => updateCollectionIcon(value)">
        <ScalarButton
          class="p-0.25 hover:bg-b-2 absolute -left-6 top-1/2 aspect-square h-6 w-6 -translate-y-1/2 cursor-pointer rounded"
          variant="ghost">
          <LibraryIcon
            class="text-c-2 size-4 stroke-[1.75]"
            :src="icon" />
        </ScalarButton>
      </IconSelector>
      <div class="ml-1.25 group">
        <LabelInput
          inputId="collectionName"
          placeholder="Untitled Collection"
          :value="data.title"
          class="text-[18px]"
          @updateValue="updateCollectionTitle" />
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.markdown) h2 {
  @apply text-lg;
}
</style>
