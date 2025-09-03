<script setup lang="ts">
import { useActiveEntities, useWorkspace } from '@scalar/api-client/store'
import { freezeAtTop } from '@scalar/helpers/dom/freeze-at-top'
import { getSlugUid } from '@scalar/oas-utils/transforms'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ApiReferenceConfiguration } from '@scalar/types'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { useDebounceFn } from '@vueuse/core'
import { computed, ref } from 'vue'

import { getCurrentIndex } from '@/components/Content/Operations/get-current-index'
import { hasLazyLoaded, lazyBus } from '@/components/Lazy/lazyBus'
import { useSidebar } from '@/features/sidebar'
import { isDescription } from '@/features/traverse-schema/types'
import { useNavState } from '@/hooks/useNavState'
import type { ClientOptionGroup } from '@/v2/blocks/scalar-request-example-block/types'

import TraversedEntry from './TraversedEntry.vue'

const { document, config } = defineProps<{
  document: OpenAPIV3_1.Document
  config: ApiReferenceConfiguration
  clientOptions: ClientOptionGroup[]
  store: WorkspaceStore
}>()

const emit = defineEmits<{
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

/** We remove the description entries but keep the rest */
const traversedEntries = computed(() =>
  items.value.entries.filter((entry) => !isDescription(entry)),
)

/** Tries to freeze the scroll position of the element */

const unfreeze = freezeAtTop(hash.value)

/** Resume scrolling on a debounce in case elements are still loading in */
const debouncedResume = useDebounceFn(() => {
  unfreeze?.()
  hasLazyLoaded.value = true
  isIntersectionEnabled.value = true
  emit('allEntriesLoaded', true)
}, 500)

/** IDs for all lazy elements above the current entry */
const lazyIds = ref<Set<string>>(new Set())

/** The index of the root entry */
const rootIndex = computed(() =>
  getCurrentIndex(hash.value, traversedEntries.value),
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
    debouncedResume()
  }
})

// Resume scrolling after 5 seconds as a failsafe
setTimeout(debouncedResume, 4500)
</script>

<template>
  <div v-if="traversedEntries.length && activeCollection">
    <!-- Use recursive component for cleaner rendering -->
    <TraversedEntry
      :activeCollection
      :activeServer
      :clientOptions
      :config
      :document
      :entries="traversedEntries"
      :rootIndex
      :store />
  </div>
</template>
