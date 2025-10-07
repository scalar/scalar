<script setup lang="ts">
import {
  createActiveEntitiesStore,
  createWorkspaceStore as createClientStore,
} from '@scalar/api-client/store'
import type { AnyApiReferenceConfiguration } from '@scalar/types/api-reference'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { computed, ref } from 'vue'

import ApiReferenceWorkspace from '@/v2/ApiReferenceWorkspace.vue'
import { normalizeConfigurations } from '@/v2/helpers/normalize-configurations'

const props = defineProps<{
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

if (typeof window !== 'undefined') {
  // @ts-expect-error - For debugging purposes expose the store
  window.dataDumpWorkspace = () => workspaceStore
}

// ---------------------------------------------------------------------------
/**
 * Configuration Handling
 *
 * We will normalize the configurations and store them in a computed property.
 * The active configuration will be associated with the active document.
 */
const configs = computed(() => normalizeConfigurations(props.configuration))

/** Search for the source with a default attribute or use the first one */
const activeSlug = ref<string>(
  Object.values(configs.value).find((c) => c.default)?.slug ??
    configs.value[0].slug ??
    '',
)

const active = computed(() => configs.value[activeSlug.value])

// ---------------------------------------------------------------------------
/**
 * Store Initialization
 *
 * During migration we must handle mapping between the legacy api-client store and the new workspace store.
 */

/**
 * Initializes the new client workspace store.
 */
const workspaceStore = createWorkspaceStore()

/**
 * Legacy API Client Store
 *
 * In a future release this will be removed and the logic merged into the workspace store.
 */
const clientStore = createClientStore({
  useLocalStorage: false,
  proxyUrl: active.value.config.proxyUrl,
  theme: active.value.config.theme,
  showSidebar: active.value.config.showSidebar,
  hideClientButton: active.value.config.hideClientButton,
  _integration: active.value.config._integration,
})

/**
 * Active Entities Store
 * Required while we are migrating to the new store
 */
const activeEntitiesStore = createActiveEntitiesStore(clientStore)
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
