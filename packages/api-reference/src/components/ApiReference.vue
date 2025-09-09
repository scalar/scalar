<script setup lang="ts">
import type { AnyApiReferenceConfiguration } from '@scalar/types/api-reference'
import { createWorkspaceStore } from '@scalar/workspace-store/client'

import ApiReferenceWorkspace from '@/v2/ApiReferenceWorkspace.vue'

defineProps<{
  /**
   * Configuration for the API reference.
   * Can be a single configuration or an array of configurations for multiple documents.
   */
  configuration?: AnyApiReferenceConfiguration
}>()

/** These slots render in their respective slots in the underlying ApiReferenceWorkspace component */
defineSlots<{
  'content-start'?(): unknown
  'content-end'?(): unknown
  'sidebar-start'?(): unknown
  'sidebar-end'?(): unknown
  footer?(): unknown
}>()

/**
 * Initializes the new client workspace store.
 *
 * TODO: Reference config should set the appropriate workspace properties
 */
const workspaceStore = createWorkspaceStore()

if (typeof window !== 'undefined') {
  // @ts-expect-error - For debugging purposes expose the store
  window.dataDumpWorkspace = () => workspaceStore
}
</script>

<template>
  <ApiReferenceWorkspace
    :configuration="configuration"
    :store="workspaceStore">
    <!-- Pass through content, sidebar and footer slots -->
    <template #content-start><slot name="content-start" /></template>
    <template #content-end><slot name="content-end" /></template>
    <template #sidebar-start><slot name="sidebar-start" /></template>
    <template #sidebar-end><slot name="sidebar-end" /></template>
    <template #footer><slot name="footer" /></template>
  </ApiReferenceWorkspace>
</template>
