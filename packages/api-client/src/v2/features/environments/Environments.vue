<script setup lang="ts">
import { ScalarIconBracketsCurly } from '@scalar/icons'
import type { Environment as EntitiesEnvironment } from '@scalar/oas-utils/entities/environment'

import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import type { EnvVariable } from '@/store'

import {
  type Environment,
  type EnvironmentVariable,
} from './components/Environment.vue'
import EnvironmentsSidebar from './components/EnvironmentsSidebar.vue'
import EnvironmentsList from './EnvironmentsList.vue'

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
              <slot name="icon">
                <ScalarIconBracketsCurly />
              </slot>
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
          <EnvironmentsList
            :documentName="documentName"
            :envVariables="envVariables"
            :environment="environment"
            :environments="environments"
            @environment:add="(payload) => emit('environment:add', payload)"
            @environment:add:variable="
              (payload) => emit('environment:add:variable', payload)
            "
            @environment:delete="
              (payload) => emit('environment:delete', payload)
            "
            @environment:delete:variable="
              (payload) => emit('environment:delete:variable', payload)
            "
            @environment:reorder="
              (payload) => emit('environment:reorder', payload)
            "
            @environment:update="
              (payload) => emit('environment:update', payload)
            "
            @environment:update:variable="
              (payload) => emit('environment:update:variable', payload)
            " />
        </div>
      </ViewLayoutSection>
    </ViewLayoutContent>
  </ViewLayout>
</template>
