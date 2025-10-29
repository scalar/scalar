<script setup lang="ts">
import type { Environment as EntitiesEnvironment } from '@scalar/oas-utils/entities/environment'

import type { EnvVariable } from '@/store'
import {
  EnvironmentsList,
  type Environment,
  type EnvironmentVariable,
} from '@/v2/features/environments'

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
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-start justify-between gap-2">
      <div class="flex flex-col gap-2">
        <div class="flex h-8 items-center">
          <h3 class="font-bold">Environment Variables</h3>
        </div>
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
      @environment:delete="(payload) => emit('environment:delete', payload)"
      @environment:delete:variable="
        (payload) => emit('environment:delete:variable', payload)
      "
      @environment:reorder="(payload) => emit('environment:reorder', payload)"
      @environment:update="(payload) => emit('environment:update', payload)"
      @environment:update:variable="
        (payload) => emit('environment:update:variable', payload)
      " />
  </div>
</template>
