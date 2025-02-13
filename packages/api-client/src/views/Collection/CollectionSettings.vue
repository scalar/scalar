<script setup lang="ts">
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import { useActiveEntities, useWorkspace } from '@/store'

const { activeCollection } = useActiveEntities()
const { collectionMutators } = useWorkspace()

function handleToggleWatchMode() {
  if (!activeCollection.value) {
    return
  }

  if (!activeCollection.value?.documentUrl) {
    return
  }
  collectionMutators.edit(
    activeCollection.value.uid,
    'watchMode',
    !activeCollection.value?.watchMode,
  )
}
</script>

<template>
  <ViewLayoutSection>
    <template #title>Watch Mode</template>

    <button
      class="border rounded-md p-2 bg-b-3 text-c-1 w-64 m-4"
      type="button"
      @click="handleToggleWatchMode">
      toggle watch mode: {{ activeCollection?.watchMode }}
    </button>
    <div class="m-4">
      status:
      {{ activeCollection?.watchModeStatus }}
    </div>
    <div class="m-4">
      document url:
      {{ activeCollection?.documentUrl }}
    </div>
  </ViewLayoutSection>
</template>
