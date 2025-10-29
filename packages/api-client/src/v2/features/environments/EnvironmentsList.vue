<script setup lang="ts">
import { ScalarButton, useModal } from '@scalar/components'
import { ScalarIconPlus } from '@scalar/icons'
import type {
  CollectionType,
  WorkspaceEventBus,
} from '@scalar/workspace-store/events'
import type { XScalarEnvironments } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { ref } from 'vue'

import EnvironmentColorUpdateModal from '@/v2/features/environments/components/EnvironmentColorUpdateModal.vue'
import EnvironmentCreateModal from '@/v2/features/environments/components/EnvironmentCreateModal.vue'
import EnvironmentDeleteModal from '@/v2/features/environments/components/EnvironmentDeleteModal.vue'
import EnvironmentNameUpdateModal from '@/v2/features/environments/components/EnvironmentNameUpdateModal.vue'

import EnvironmentComponent from './components/Environment.vue'

const { environments, eventBus, type } = defineProps<
  {
    environments: NonNullable<XScalarEnvironments['x-scalar-environments']>
    eventBus: WorkspaceEventBus
  } & CollectionType
>()

const createEnvironmentModalState = useModal()
const deleteEnvironmentModalState = useModal()
const updateNameEnvironmentModalState = useModal()
const updateColorEnvironmentModalState = useModal()

// Track the currently selected environment for editing or deleting
const selectedEnvironment = ref<Environment | null>(null)
</script>

<template>
  <EnvironmentComponent
    v-for="[name, env] in Object.entries(environments)"
    :key="name"
    :environment="env"
    :eventBus="eventBus"
    :name="name"
    :type="type" />

  <!-- Add Environment CTA -->
  <div
    class="text-c-3 flex h-full items-center justify-center rounded-lg border p-4">
    <ScalarButton
      class="hover:bg-b-2 hover:text-c-1 flex items-center gap-2"
      size="sm"
      variant="ghost"
      @click="createEnvironmentModalState.show()">
      <ScalarIconPlus />
      Add Environment
    </ScalarButton>
  </div>

  <!-- Modals -->
  <EnvironmentCreateModal
    :state="createEnvironmentModalState"
    @submit="
      (payload) =>
        emit('environment:add', {
          environment: {
            name: payload.name,
            color: payload.color,
            variables: [],
          },
        })
    " />
  <EnvironmentDeleteModal
    v-if="selectedEnvironment"
    :name="selectedEnvironment.name"
    :state="deleteEnvironmentModalState"
    @submit="
      () =>
        emit('environment:delete', {
          environmentName: selectedEnvironment!.name,
        })
    " />
  <EnvironmentNameUpdateModal
    v-if="selectedEnvironment"
    :name="selectedEnvironment.name"
    :state="updateNameEnvironmentModalState"
    @submit="
      (payload) =>
        emit('environment:update', {
          environmentName: selectedEnvironment!.name,
          environment: { name: payload.name },
        })
    " />
  <EnvironmentColorUpdateModal
    v-if="selectedEnvironment"
    :color="selectedEnvironment.color || '#FFFFFF'"
    :state="updateColorEnvironmentModalState"
    @submit="
      (payload) =>
        emit('environment:update', {
          environmentName: selectedEnvironment!.name,
          environment: { color: payload.color },
        })
    " />
</template>
