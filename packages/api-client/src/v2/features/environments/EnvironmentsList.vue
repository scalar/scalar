<script setup lang="ts">
import { ScalarButton, useModal } from '@scalar/components'
import { ScalarIconPlus } from '@scalar/icons'
import type { Environment as EntitiesEnvironment } from '@scalar/oas-utils/entities/environment'
import { ref } from 'vue'

import type { EnvVariable } from '@/store'
import EnvironmentColorUpdateModal from '@/v2/features/environments/components/EnvironmentColorUpdateModal.vue'
import EnvironmentCreateModal from '@/v2/features/environments/components/EnvironmentCreateModal.vue'
import EnvironmentDeleteModal from '@/v2/features/environments/components/EnvironmentDeleteModal.vue'
import EnvironmentNameUpdateModal from '@/v2/features/environments/components/EnvironmentNameUpdateModal.vue'

import EnvironmentComponent, {
  type Environment,
  type EnvironmentVariable,
} from './components/Environment.vue'

defineProps<{
  /** Current selected document name or when null it means workspace level environments */
  documentName: string | null

  /** List of all available environments for the selected document */
  environments: Environment[]

  /** TODO: remove when we migrate to the new store */
  environment: EntitiesEnvironment
  envVariables: EnvVariable[]
}>()

const emit = defineEmits<{
  // Environment events
  (
    e: 'environment:reorder',
    payload: {
      draggingItem: { id: string }
      hoveredItem: { id: string }
    },
  ): void
  (e: 'environment:add', payload: { environment: Environment }): void
  (
    e: 'environment:update',
    payload: { environmentName: string; environment: Partial<Environment> },
  ): void
  (e: 'environment:delete', payload: { environmentName: string }): void

  /** Environment variable events */
  (
    e: 'environment:add:variable',
    payload: {
      environmentName: string
      environmentVariable: Partial<EnvironmentVariable>
    },
  ): void
  (
    e: 'environment:update:variable',
    payload: {
      /** Row number */
      id: number
      /** Environment name */
      environmentName: string
      /** Payload */
      environmentVariable: Partial<EnvironmentVariable>
    },
  ): void
  (
    e: 'environment:delete:variable',
    payload: {
      /** Environment name */
      environmentName: string
      /** Row number */
      id: number
    },
  ): void
}>()

defineSlots<{
  icon: () => unknown
}>()

const createEnvironmentModalState = useModal()
const deleteEnvironmentModalState = useModal()
const updateNameEnvironmentModalState = useModal()
const updateColorEnvironmentModalState = useModal()

// Track the currently selected environment for editing or deleting
const selectedEnvironment = ref<Environment | null>(null)
</script>

<template>
  <EnvironmentComponent
    v-for="env in environments"
    :key="env.name"
    :color="env.color"
    :envVariables="envVariables"
    :environment="environment"
    :isReadonly="!documentName"
    :name="env.name"
    :variables="env.variables"
    @add:variable="
      (payload) =>
        emit('environment:add:variable', {
          environmentName: env.name,
          environmentVariable: payload,
        })
    "
    @delete="
      () => {
        selectedEnvironment = env
        deleteEnvironmentModalState.show()
      }
    "
    @delete:variable="
      ({ id }) =>
        emit('environment:delete:variable', {
          environmentName: env.name,
          id,
        })
    "
    @reorder="
      (draggingItem, hoveredItem) =>
        emit('environment:reorder', {
          draggingItem,
          hoveredItem,
        })
    "
    @update:color="
      () => {
        selectedEnvironment = env
        updateColorEnvironmentModalState.show()
      }
    "
    @update:name="
      () => {
        selectedEnvironment = env
        updateNameEnvironmentModalState.show()
      }
    "
    @update:variable="
      ({ id, value }) =>
        emit('environment:update:variable', {
          environmentName: env.name,
          id,
          environmentVariable: value,
        })
    " />
  <div
    v-if="documentName !== null"
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
