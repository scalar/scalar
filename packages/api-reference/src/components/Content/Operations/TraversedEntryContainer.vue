<script setup lang="ts">
import { useActiveEntities, useWorkspace } from '@scalar/api-client/store'
import { getSlugUid } from '@scalar/oas-utils/transforms'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ApiReferenceConfiguration } from '@scalar/types'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { computed, ref } from 'vue'

import { type TraversedEntry as TraversedEntryType } from '@/features/traverse-schema'
import { traverseDocument } from '@/features/traverse-schema/helpers/traverse-document'
import { useNavState } from '@/hooks/useNavState'

import TraversedEntry from './TraversedEntry.vue'

const { document, config } = defineProps<{
  document: OpenAPIV3_1.Document
  config: ApiReferenceConfiguration
  store: WorkspaceStore
}>()

const { collections, servers } = useWorkspace()
const { activeCollection: _activeCollection } = useActiveEntities()

/**
 * Generate IDs for the different types of entities
 */
const {
  getHeadingId,
  getOperationId,
  getWebhookId,
  getModelId,
  getTagId,
  getSectionId,
} = useNavState()

/**
 * Match the collection by slug if provided
 *
 * @deprecated
 **/
const activeCollection = computed(() => {
  if (config?.slug) {
    const collection = collections[getSlugUid(config.slug)]

    if (collection) {
      return collection
    }
  }

  return _activeCollection.value
})

/**
 * Ensure the server is the one selected in the collection
 *
 * @deprecated
 **/
const activeServer = computed(() => {
  if (!activeCollection.value) {
    return undefined
  }

  if (activeCollection.value.selectedServerUid) {
    const server = servers[activeCollection.value.selectedServerUid]
    if (server) {
      return server
    }
  }

  return servers[activeCollection.value.servers[0]]
})

/**
 * A list of tags including their children and operations.
 *
 * Matches the sidebar.
 *
 * TODO: remove this and use the one that comes from the workspace store
 */
const entries = computed((): TraversedEntryType[] => {
  if (!config) {
    return []
  }

  // Use traverseDocument to process the OpenAPI document
  const { entries: traversedEntries } = traverseDocument(document, {
    config: ref(config),
    getHeadingId,
    getOperationId,
    getWebhookId,
    getModelId,
    getTagId,
    getSectionId,
  })

  return traversedEntries
})
</script>

<template>
  <template v-if="entries.length && activeCollection">
    <!-- Use recursive component for cleaner rendering -->
    <TraversedEntry
      :entries="entries"
      :document="document"
      :config="config"
      :activeCollection="activeCollection"
      :activeServer="activeServer"
      :store="store" />
  </template>
</template>
