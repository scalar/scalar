<script setup lang="ts">
import { ScalarButton, useModal } from '@scalar/components'
import { ScalarIconBracketsCurly, ScalarIconPlus } from '@scalar/icons'
import type { Environment as EntitiesEnvironment } from '@scalar/oas-utils/entities/environment'
import { ref } from 'vue'

import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import type { EnvVariable } from '@/store'

import EnvironmentComponent from './components/Environment.vue'
import EnvironmentColorUpdateModal from './components/EnvironmentColorUpdateModal.vue'
import EnvironmentCreateModal from './components/EnvironmentCreateModal.vue'
import EnvironmentDeleteModal from './components/EnvironmentDeleteModal.vue'
import EnvironmentNameUpdateModal from './components/EnvironmentNameUpdateModal.vue'
import EnvironmentsSidebar from './components/EnvironmentsSidebar.vue'

type EnvironmentVariable = {
  name: string
  value: string
}

type Environment = {
  name: string
  color?: string
  variables: EnvironmentVariable[]
}

defineProps<{
  /** Current selected document name or when null it means workspace level cookies */
  documentName: string | null
  /** List of all document names */
  documents: string[]
  /** List of all available environments for the selected document */
  environments: Environment[]
  /** Sidebar width */
  sidebarWidth?: number

  /** TODO: remove when we migrate to the new store */
  environment: EntitiesEnvironment
  envVariables: EnvVariable[]
}>()

const emit = defineEmits<{
  // Navigation events
  (e: 'navigation:update:selection', value: string | null): void
  (e: 'navigation:update:sidebarWidth', value: number): void

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

const createEnvironmentModalState = useModal()
const deleteEnvironmentModalState = useModal()
const updateNameEnvironmentModalState = useModal()
const updateColorEnvironmentModalState = useModal()

// Track the currently selected environment for editing or deleting
const selectedEnvironment = ref<Environment | null>(null)
</script>

<template>
  <ViewLayout>
    <EnvironmentsSidebar
      :documentName="documentName"
      :documents="documents"
      title="Manage Environments"
      :width="sidebarWidth"
      @update:selection="(value) => emit('navigation:update:selection', value)"
      @update:width="
        (value) => emit('navigation:update:sidebarWidth', value)
      " />
    <ViewLayoutContent class="flex-1">
      <ViewLayoutSection>
        <div
          class="mx-auto flex max-h-full w-full max-w-[720px] !flex-col gap-8 overflow-auto px-5 py-15">
          <div class="flex flex-col gap-2">
            <h2 class="flex items-center gap-2 text-xl font-bold">
              <ScalarIconBracketsCurly />
              Environment Variables
            </h2>
            <p class="text-c-2 mb-4 text-sm">
              Set environment variables at your collection level. Use
              <code
                v-pre
                class="font-code text-c-2">
                {{ variable }}
              </code>
              to add / search among the selected environment's variables in your
              request inputs.
            </p>
          </div>
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
            @edit:color="
              () => {
                selectedEnvironment = env
                updateColorEnvironmentModalState.show()
              }
            "
            @edit:name="
              () => {
                selectedEnvironment = env
                updateNameEnvironmentModalState.show()
              }
            "
            @reorder="
              (draggingItem, hoveredItem) =>
                emit('environment:reorder', {
                  draggingItem,
                  hoveredItem,
                })
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
          :state="updateColorEnvironmentModalState" />
      </ViewLayoutSection>
    </ViewLayoutContent>
  </ViewLayout>
</template>
