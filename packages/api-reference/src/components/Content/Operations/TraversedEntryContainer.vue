<script setup lang="ts">
import { useActiveEntities, useWorkspace } from '@scalar/api-client/store'
import { freezeAtTop } from '@scalar/helpers/dom/freeze-at-top'
import { getSlugUid } from '@scalar/oas-utils/transforms'
import type { ApiReferenceConfiguration } from '@scalar/types'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, ref } from 'vue'

import { getCurrentIndex } from '@/components/Content/Operations/get-current-index'
import { hasLazyLoaded, lazyBus } from '@/components/Lazy/lazyBus'
import { useSidebar } from '@/features/sidebar'
import { useNavState } from '@/hooks/useNavState'
import type { ClientOptionGroup } from '@/v2/blocks/scalar-request-example-block/types'

import TraversedEntry from './TraversedEntry.vue'

const { config, store } = defineProps<{
  config: ApiReferenceConfiguration
  clientOptions: ClientOptionGroup[]
  document: OpenApiDocument
  store: WorkspaceStore
}>()

const emit = defineEmits<{
  /** When all entries are loaded, used for testing */
  allEntriesLoaded: [loaded: true]
}>()

const { collections, servers } = useWorkspace()
const { activeCollection: _activeCollection } = useActiveEntities()

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

const { items } = useSidebar()
const { hash, isIntersectionEnabled } = useNavState()

/** Tries to freeze the scroll position of the element */
const unfreeze = freezeAtTop(hash.value)

/** Resume scrolling */
const resume = () => {
  unfreeze?.()
  hasLazyLoaded.value = true
  isIntersectionEnabled.value = true
}

/** IDs for all lazy elements above the current entry */
const lazyIds = ref<Set<string>>(new Set())

/** The index of the root entry */
const rootIndex = computed(() =>
  getCurrentIndex(hash.value, items.value.entries),
)

// Use the lazybus to handle [un]freezing elements
lazyBus.on(({ loading, loaded, save }) => {
  if (hasLazyLoaded.value) {
    return
  }

  // Track the previous elements that are loading
  if (loading && save) {
    lazyIds.value.add(loading)
  }

  // Track which elements have loaded
  if (loaded && save) {
    lazyIds.value.delete(loaded)
  }

  // We are empty! Unfreeze the page
  if (lazyIds.value.size === 0) {
    emit('allEntriesLoaded', true)
    setTimeout(() => resume(), 300)
  }
})

// Resume scrolling after 5 seconds as a failsafe
setTimeout(() => resume(), 5000)
</script>

<template>
  <div v-if="items.entries.length && activeCollection">
    <!-- Use recursive component for cleaner rendering -->
    <TraversedEntry
      :entries="items.entries"
      :activeCollection
      :activeServer
      :document
      :clientOptions
      :config
      :rootIndex
      :store />
  </div>
</template>
