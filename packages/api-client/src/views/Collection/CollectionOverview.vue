<script setup lang="ts">
import { ScalarViewLayoutSection } from '@scalar/components/components/ScalarViewLayout'

import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import MarkdownInput from '@/views/Collection/components/MarkdownInput.vue'

const {
  activeCollection,
  activeEnvironment,
  activeEnvVariables,
  activeWorkspace,
} = useActiveEntities()
const { collectionMutators } = useWorkspace()

/**
 * Update info.description
 */
const updateCollectionDescription = (value: string) => {
  if (!activeCollection.value) {
    return
  }

  collectionMutators.edit(activeCollection.value.uid, 'info.description', value)
}
</script>

<template>
  <ScalarViewLayoutSection>
    <MarkdownInput
      v-if="activeEnvironment && activeWorkspace"
      :envVariables="activeEnvVariables"
      :environment="activeEnvironment"
      :modelValue="activeCollection?.info?.description ?? ''"
      :workspace="activeWorkspace"
      @update:modelValue="updateCollectionDescription" />
  </ScalarViewLayoutSection>
</template>
