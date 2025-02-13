<script setup lang="ts">
import DeleteSidebarListElement from '@/components/Sidebar/Actions/DeleteSidebarListElement.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import { PathId } from '@/router'
import { useActiveEntities, useWorkspace } from '@/store'
import { ScalarModal, useModal } from '@scalar/components'
import { useRouter } from 'vue-router'

const { activeCollection, activeWorkspace, activeWorkspaceCollections } =
  useActiveEntities()
const { collectionMutators } = useWorkspace()
const { replace } = useRouter()
const deleteModal = useModal()

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

function handleDeleteCollection() {
  if (!activeCollection.value) return

  if (!activeWorkspace.value) return

  collectionMutators.delete(activeCollection.value, activeWorkspace.value)

  // Redirect to the first collection
  if (activeWorkspaceCollections.value[0]) {
    replace({
      name: 'request.root',
      params: {
        [PathId.Workspace]: activeWorkspace.value.uid,
      },
    })
  }

  deleteModal.hide()
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
  <ViewLayoutSection>
    <template #title>Danger Zone</template>
    <div>
      <button
        class="border rounded-md p-2 bg-b-3 text-c-1 w-64 m-4"
        type="button"
        @click="deleteModal.show()">
        delete collection
      </button>
    </div>
  </ViewLayoutSection>

  <!-- Delete Modal -->
  <ScalarModal
    :size="'xxs'"
    :state="deleteModal"
    :title="`Delete ${activeCollection?.title}`">
    <DeleteSidebarListElement
      :variableName="activeCollection?.title ?? ''"
      :warningMessage="'This action cannot be undone.'"
      @close="deleteModal.hide()"
      @delete="handleDeleteCollection" />
  </ScalarModal>
</template>
