<script setup lang="ts">
import {
  ScalarButton,
  ScalarIcon,
  ScalarModal,
  useModal,
} from '@scalar/components'
import { Draggable } from '@scalar/draggable'
import { ScalarIconTrash } from '@scalar/icons'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import { computed, ref } from 'vue'

import DeleteSidebarListElement from '@/components/Sidebar/Actions/DeleteSidebarListElement.vue'
import EditSidebarListElement from '@/components/Sidebar/Actions/EditSidebarListElement.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import { useActiveEntities, useWorkspace } from '@/store'
import EnvironmentColorModal from '@/views/Environment/EnvironmentColorModal.vue'
import EnvironmentModal from '@/views/Environment/EnvironmentModal.vue'

import EnvironmentForm from './components/EnvironmentForm.vue'

const { activeCollection, activeWorkspace, activeEnvVariables } =
  useActiveEntities()
const { collectionMutators } = useWorkspace()

const colorModal = useModal()
const deleteModal = useModal()
const environmentModal = useModal()
const editModal = useModal()
const selectedColor = ref('')
const selectedEnvironmentName = ref<string | null>(null)
const tempEnvironmentName = ref<string | undefined>(undefined)

const collectionEnvironments = computed(() => {
  if (!activeCollection.value?.['x-scalar-environments']) {
    return []
  }
  return Object.entries(activeCollection.value['x-scalar-environments']).map(
    ([name, environment]) => ({
      uid: name as Environment['uid'],
      name,
      value: JSON.stringify(environment.variables || {}),
      color: environment.color || '#FFFFFF',
    }),
  )
})

const deleteEnvironment = () => {
  if (!activeCollection.value?.uid || !selectedEnvironmentName.value) {
    return
  }

  collectionMutators.removeEnvironment(
    selectedEnvironmentName.value,
    activeCollection.value.uid,
  )
  deleteModal.hide()
}

const openDeleteModal = (environmentName: string) => {
  selectedEnvironmentName.value = environmentName
  deleteModal.show()
}

const handleEnvironmentSubmit = (environment: {
  name: string
  color: string
  collectionId: string | undefined
}) => {
  if (!activeCollection.value?.uid) {
    return
  }

  collectionMutators.addEnvironment(
    environment.name,
    {
      variables: {},
      color: environment.color,
    },
    activeCollection.value.uid,
  )
  environmentModal.hide()
}

const handleOpenColorModal = (environment: {
  name: string
  color?: string | undefined
}) => {
  selectedEnvironmentName.value = environment.name
  selectedColor.value = environment.color || '#FFFFFF'
  colorModal.show()
}

const submitColorChange = (color: string) => {
  if (!activeCollection.value?.uid || !selectedEnvironmentName.value) {
    return
  }

  const environments = {
    ...activeCollection.value['x-scalar-environments'],
    [selectedEnvironmentName.value]: {
      variables:
        activeCollection.value['x-scalar-environments']?.[
          selectedEnvironmentName.value
        ]?.variables || {},
      color,
    },
  }

  collectionMutators.edit(
    activeCollection.value.uid,
    'x-scalar-environments',
    environments,
  )
  colorModal.hide()
}

const openRenameModal = (environmentName: string) => {
  selectedEnvironmentName.value = environmentName
  tempEnvironmentName.value = environmentName
  editModal.show()
}

const closeRenameModal = () => {
  selectedEnvironmentName.value = null
  tempEnvironmentName.value = undefined
  editModal.hide()
}

const handleRename = (newName: string) => {
  if (!activeCollection.value?.uid || !selectedEnvironmentName.value) {
    return
  }

  const environments = { ...activeCollection.value['x-scalar-environments'] }
  const environment = environments[selectedEnvironmentName.value]
  if (!environment) {
    return
  }

  // Create a new ordered environments object
  const orderedEnvs: Record<string, any> = {}
  const envEntries = Object.entries(environments)

  // Find the index of the environment being renamed
  const envIndex = envEntries.findIndex(
    ([key]) => key === selectedEnvironmentName.value,
  )

  // Rebuild the environments object maintaining order
  envEntries.forEach(([key, value], index) => {
    if (index === envIndex) {
      orderedEnvs[newName] = value
    } else {
      orderedEnvs[key] = value
    }
  })

  collectionMutators.edit(
    activeCollection.value.uid,
    'x-scalar-environments',
    orderedEnvs,
  )

  selectedEnvironmentName.value = null
  tempEnvironmentName.value = undefined
  editModal.hide()
}

const handleDragEnd = (
  draggingItem: { id: string },
  hoveredItem: { id: string },
) => {
  if (!activeCollection.value?.uid) {
    return
  }

  const environments = { ...activeCollection.value['x-scalar-environments'] }
  const orderedEnvs: Record<string, any> = {}
  const envEntries = Object.entries(environments)

  // Find the indices of the dragged and hovered items
  const dragIndex = envEntries.findIndex(([key]) => key === draggingItem.id)
  const hoverIndex = envEntries.findIndex(([key]) => key === hoveredItem.id)

  if (dragIndex === -1 || hoverIndex === -1) {
    return
  }

  // Reorder the environments
  const draggedEnv = envEntries[dragIndex]
  if (!draggedEnv) {
    return
  }
  envEntries.splice(dragIndex, 1)
  envEntries.splice(hoverIndex, 0, draggedEnv)

  // Rebuild the environments object in the new order
  envEntries.forEach(([key, value]) => {
    orderedEnvs[key] = value
  })

  collectionMutators.edit(
    activeCollection.value.uid,
    'x-scalar-environments',
    orderedEnvs,
  )
}
</script>

<template>
  <ViewLayoutSection>
    <div class="flex h-full w-full flex-col gap-12 px-1.5 pt-8">
      <div class="flex flex-col gap-4">
        <div class="flex items-start justify-between gap-2">
          <div class="flex flex-col gap-2">
            <div class="flex h-8 items-center">
              <h3 class="font-bold">Environment Variables</h3>
            </div>
            <p class="text-sm">
              Set environment variables at your collection level. Use
              <code
                class="font-code text-c-2"
                v-pre
                >{{ variable }}</code
              >
              to add / search among the selected environment's variables in your
              request inputs.
            </p>
          </div>
        </div>
        <Draggable
          v-for="environment in collectionEnvironments"
          :key="environment.name"
          :id="environment.name"
          :isDraggable="true"
          :isDroppable="true"
          :parentIds="[]"
          @onDragEnd="handleDragEnd">
          <div class="rounded-lg border">
            <div
              class="bg-b-2 flex cursor-grab items-center justify-between rounded-t-lg px-1 py-1 text-sm">
              <div class="flex items-center">
                <ScalarButton
                  class="hover:bg-b-3 flex h-6 w-6 p-1"
                  @click="handleOpenColorModal(environment)"
                  variant="ghost">
                  <span
                    :style="{ backgroundColor: environment.color || '#FFFFFF' }"
                    class="h-2.5 w-2.5 rounded-full"></span>
                </ScalarButton>
                <button
                  class="hover:bg-b-3 rounded px-1 py-0.5 text-sm"
                  @click="openRenameModal(environment.name)">
                  {{ environment.name }}
                </button>
              </div>
              <ScalarButton
                class="hover:bg-b-3 hover:text-c-1 h-fit p-1.25"
                variant="ghost"
                @click="openDeleteModal(environment.name)">
                <ScalarIconTrash class="size-3.5" />
              </ScalarButton>
            </div>
            <EnvironmentForm
              v-if="activeCollection && activeWorkspace"
              :collection="activeCollection"
              :environment="environment"
              :envVariables="activeEnvVariables"
              :workspace="activeWorkspace" />
          </div>
        </Draggable>
        <div
          class="text-c-3 flex h-full items-center justify-center rounded-lg border p-4">
          <ScalarButton
            class="hover:bg-b-2 hover:text-c-1 flex items-center gap-2"
            size="sm"
            variant="ghost"
            @click="environmentModal.show()">
            <ScalarIcon
              class="inline-flex"
              icon="Add"
              size="sm"
              thickness="1.5" />
            <span>Add Environment</span>
          </ScalarButton>
        </div>
      </div>
      <ScalarModal
        :size="'xxs'"
        :state="deleteModal"
        :title="`Delete ${selectedEnvironmentName || 'Environment'}`">
        <DeleteSidebarListElement
          :variableName="'Environment'"
          :warningMessage="'Are you sure you want to delete this environment? This action cannot be undone.'"
          @close="deleteModal.hide()"
          @delete="deleteEnvironment" />
      </ScalarModal>
      <EnvironmentModal
        :activeWorkspaceCollections="activeCollection ? [activeCollection] : []"
        :collectionId="activeCollection?.uid"
        :state="environmentModal"
        @cancel="environmentModal.hide()"
        @submit="handleEnvironmentSubmit" />
      <EnvironmentColorModal
        :selectedColor="selectedColor"
        :state="colorModal"
        @cancel="colorModal.hide()"
        @submit="submitColorChange" />
      <ScalarModal
        :size="'xxs'"
        :state="editModal"
        :title="`Edit ${selectedEnvironmentName}`">
        <EditSidebarListElement
          :name="tempEnvironmentName ?? ''"
          @close="closeRenameModal"
          @edit="handleRename" />
      </ScalarModal>
    </div>
  </ViewLayoutSection>
</template>

<style>
@import '@scalar/draggable/style.css';
</style>
