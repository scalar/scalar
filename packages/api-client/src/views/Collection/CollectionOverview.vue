<script setup lang="ts">
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import MarkdownInput from '@/views/Collection/components/MarkdownInput.vue'

const { activeCollection } = useActiveEntities()
const { collectionMutators } = useWorkspace()

/**
 * Update info.description
 */
const updateCollectionDescription = (value: string) => {
  if (!activeCollection.value) return

  collectionMutators.edit(activeCollection.value.uid, 'info.description', value)
}
</script>

<template>
  <ViewLayoutSection>
    <MarkdownInput
      :modelValue="activeCollection?.info?.description ?? ''"
      @update:modelValue="updateCollectionDescription" />
  </ViewLayoutSection>
</template>
