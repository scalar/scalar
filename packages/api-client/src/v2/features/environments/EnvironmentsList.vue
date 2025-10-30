<script setup lang="ts">
import { ScalarButton, useModal } from '@scalar/components'
import { ScalarIconPlus } from '@scalar/icons'
import type {
  CollectionType,
  WorkspaceEventBus,
} from '@scalar/workspace-store/events'
import type {
  XScalarEnvironment,
  XScalarEnvironments,
} from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { ref } from 'vue'

import EnvironmentCreateModal from '@/v2/features/environments/components/EnvironmentCreateModal.vue'
import EnvironmentDeleteModal from '@/v2/features/environments/components/EnvironmentDeleteModal.vue'

import EnvironmentComponent from './components/Environment.vue'

const { environments, eventBus, type } = defineProps<
  {
    environments: NonNullable<XScalarEnvironments['x-scalar-environments']>
    eventBus: WorkspaceEventBus
  } & CollectionType
>()

const createEnvironmentModalState = useModal()
const deleteEnvironmentModalState = useModal()

/** Track the currently selected environment for editing or deleting */
const selectedEnvironmentName = ref<string | null>(null)

/** Opens the delete modal */
const openDeleteModal = (name: string) => {
  selectedEnvironmentName.value = name
  deleteEnvironmentModalState.show()
}

/** Deletes the selected environment */
const deleteEnvironment = () => {
  if (!selectedEnvironmentName.value) {
    return
  }
  eventBus.emit('environment:delete:environment', {
    environmentName: selectedEnvironmentName.value,
    type,
  })
}

/** Opens the upsert modal, leave name empty for add */
const openUpsertModal = (name?: string) => {
  selectedEnvironmentName.value = name ?? null
  createEnvironmentModalState.show()
}
</script>

<template>
  <EnvironmentComponent
    v-for="[name, env] in Object.entries(environments)"
    :key="name"
    :environment="env"
    :eventBus="eventBus"
    :name="name"
    :type="type"
    @delete="() => openDeleteModal(name)"
    @edit="() => openUpsertModal(name)" />

  <!-- Add Environment CTA -->
  <div
    class="text-c-3 flex h-full items-center justify-center rounded-lg border p-4">
    <ScalarButton
      class="hover:bg-b-2 hover:text-c-1 flex items-center gap-2"
      size="sm"
      variant="ghost"
      @click="() => openUpsertModal()">
      <ScalarIconPlus />
      Add Environment
    </ScalarButton>
  </div>

  <!-- Upsert Modal -->
  <EnvironmentCreateModal
    :environments="environments"
    :eventBus="eventBus"
    :selectedEnvironmentName="selectedEnvironmentName"
    :state="createEnvironmentModalState"
    :type="type" />

  <!-- Delete Modal -->
  <EnvironmentDeleteModal
    :name="selectedEnvironmentName"
    :state="deleteEnvironmentModalState"
    @submit="deleteEnvironment" />
</template>
