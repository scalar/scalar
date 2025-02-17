<script setup lang="ts">
import DeleteSidebarListElement from '@/components/Sidebar/Actions/DeleteSidebarListElement.vue'
import { PathId } from '@/router'
import { useActiveEntities, useWorkspace } from '@/store'
import {
  ScalarButton,
  ScalarIcon,
  ScalarModal,
  ScalarToggle,
  useModal,
} from '@scalar/components'
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
  <div
    class="flex flex-col gap-12 h-full mx-auto py-8 w-full md:max-h-[82dvh] md:max-w-[50dvw]">
    <div class="flex flex-col gap-4">
      Features
      <!-- Watch Mode -->
      <div class="bg-b-2 border rounded-lg text-sm">
        <div
          class="bg-b-1 border flex gap-4 items-center justify-between -m-1/2 p-3 rounded-t-lg">
          <div>
            <h3>Watch Mode</h3>
            <p class="mt-1 text-c-2">
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
          class="flex items-center overflow-x-auto py-1.5 whitespace-nowrap text-c-1">
          <div class="flex items-center">
            <template v-if="activeCollection?.documentUrl">
              <span class="bg-b-2 sticky left-0 pl-3 pr-2">Source</span>
              <a
                class="group text-c-2 no-underline rounded hover:underline pr-3"
                :href="activeCollection.documentUrl"
                target="_blank">
                {{ activeCollection.documentUrl }}
                <ScalarIcon
                  class="hidden group-hover:inline ml-1 w-2.5"
                  icon="ExternalLink" />
              </a>
            </template>
            <template v-else>
              <ScalarIcon
                class="ml-3 mr-2 w-4 text-c-2"
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
      <div>Danger Zone</div>
      <div
        class="border flex items-center justify-between p-3 rounded-lg text-sm">
        <div>
          <h3>Delete Collection</h3>
          <p class="mt-1 text-c-2">
            Be careful, my friend. Once deleted, there is no way to recover the
            collection.
          </p>
        </div>
        <ScalarButton
          class="gap-1.5 font-medium px-2.5 h-8 shadow-none focus:outline-none custom-scroll whitespace-nowrap"
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
