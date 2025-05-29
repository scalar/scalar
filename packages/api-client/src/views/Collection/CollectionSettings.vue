<script setup lang="ts">
import {
  ScalarButton,
  ScalarIcon,
  ScalarModal,
  ScalarToggle,
  useModal,
} from '@scalar/components'
import { useRouter } from 'vue-router'

import DeleteSidebarListElement from '@/components/Sidebar/Actions/DeleteSidebarListElement.vue'
import { PathId } from '@/router'
import { useActiveEntities, useWorkspace } from '@/store'

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
  if (!activeCollection.value) {
    return
  }

  if (!activeWorkspace.value) {
    return
  }

  collectionMutators.delete(activeCollection.value, activeWorkspace.value)

  const firstCollection = activeWorkspaceCollections.value[0]

  // Redirect to the first collection
  if (firstCollection) {
    replace({
      name: 'collection',
      params: {
        [PathId.Workspace]: activeWorkspace.value.uid,
        [PathId.Collection]: firstCollection.uid,
      },
    })
  }

  deleteModal.hide()
}
</script>

<template>
  <div class="flex h-full w-full flex-col gap-12 px-1.5 pt-8">
    <div class="flex flex-col gap-2">
      <div class="flex h-8 items-center">
        <h3 class="font-bold">Features</h3>
      </div>
      <!-- Watch Mode -->
      <div class="bg-b-2 rounded-lg border text-sm">
        <div
          class="bg-b-1 flex items-center justify-between gap-4 rounded-t-lg p-3">
          <div>
            <h4>Watch Mode</h4>
            <p class="text-c-2 mt-1">
              When enabled, the OpenAPI document will be polled for changes. The
              collection will be updated automatically.
            </p>
          </div>
          <ScalarToggle
            class="w-4"
            :disabled="!activeCollection?.documentUrl"
            :modelValue="activeCollection?.watchMode ?? false"
            @update:modelValue="handleToggleWatchMode" />
        </div>
        <div
          class="text-c-1 flex items-center overflow-x-auto border-t py-1.5 whitespace-nowrap">
          <div class="flex items-center">
            <template v-if="activeCollection?.documentUrl">
              <span class="bg-b-2 sticky left-0 pr-2 pl-3">Source</span>
              <a
                class="text-c-2 group rounded pr-3 no-underline hover:underline"
                :href="activeCollection.documentUrl"
                target="_blank">
                {{ activeCollection.documentUrl }}
                <ScalarIcon
                  class="ml-1 hidden w-2.5 group-hover:inline"
                  icon="ExternalLink" />
              </a>
            </template>
            <template v-else>
              <ScalarIcon
                class="text-c-2 mr-2 ml-3 w-4"
                icon="NotAllowed"
                size="sm" />
              <span class="text-c-2 pr-3">
                No URL configured. Try importing an OpenAPI document from an
                URL.
              </span>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Danger Zone -->
    <div class="flex flex-col gap-4">
      <h3 class="font-bold">Danger Zone</h3>
      <div
        class="flex items-center justify-between rounded-lg border p-3 text-sm">
        <div>
          <h4>Delete Collection</h4>
          <p class="text-c-2 mt-1">
            Be careful, my friend. Once deleted, there is no way to recover the
            collection.
          </p>
        </div>
        <ScalarButton
          class="custom-scroll h-8 gap-1.5 px-2.5 font-medium whitespace-nowrap shadow-none focus:outline-none"
          :variant="'danger'"
          @click="deleteModal.show()">
          Delete Collection
        </ScalarButton>
      </div>
    </div>
  </div>
  <!-- Delete Modal -->
  <ScalarModal
    :size="'xxs'"
    :state="deleteModal"
    :title="`Delete ${activeCollection?.info?.title}`">
    <DeleteSidebarListElement
      :variableName="activeCollection?.info?.title ?? ''"
      :warningMessage="'This action cannot be undone.'"
      @close="deleteModal.hide()"
      @delete="handleDeleteCollection" />
  </ScalarModal>
</template>
<style scoped>
.scalar-button-danger {
  background: color-mix(in srgb, var(--scalar-color-red), transparent 95%);
  color: var(--scalar-color-red);
}
.scalar-button-danger:hover,
.scalar-button-danger:focus {
  background: color-mix(in srgb, var(--scalar-color-red), transparent 90%);
}
</style>
