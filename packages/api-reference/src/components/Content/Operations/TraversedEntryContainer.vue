<script setup lang="ts">
import { useActiveEntities, useWorkspace } from '@scalar/api-client/store'
import { freezeElement } from '@scalar/helpers/dom/freeze-element'
import { scrollToId } from '@scalar/helpers/dom/scroll-to-id'
import { getSlugUid } from '@scalar/oas-utils/transforms'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ApiReferenceConfiguration } from '@scalar/types'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { useMutationObserver } from '@vueuse/core'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'

import { hasLazyLoaded, lazyBus } from '@/components/Lazy/lazyBus'
import { useSidebar } from '@/features/sidebar'
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

/** Keeps track of our unfreeze function */
const unfreeze = ref<(() => void) | null>(null)

/** Resume scrolling */
const resume = () => {
  unfreeze.value?.()
  hasLazyLoaded.value = true
  isIntersectionEnabled.value = true
}

/** So we know when we have loaded all lazy elements */
const lazyIds = ref<Set<string>>(new Set())

// No need to freeze if we don't have a hash
if (!hash.value || hash.value.startsWith('description')) {
  hasLazyLoaded.value = true
}

// Use the lazybus to handle [un]freezing elements
lazyBus.on(({ loading, loaded }) => {
  if (hasLazyLoaded.value) {
    return
  }

  // Track which elements are loading
  if (loading) {
    lazyIds.value.add(loading)
  }

  // Track which elements have loaded
  if (loaded) {
    lazyIds.value.delete(loaded)
  }

  // We are empty! Unfreeze the page
  if (lazyIds.value.size === 0 && unfreeze.value) {
    setTimeout(() => resume(), 300)
  }
})

// Resume scrolling after 5 seconds as a failsafe
setTimeout(() => resume(), 5000)

const containerRef = useTemplateRef('container')

// We are waiting for the correct element to be loaded and we freeze the scroll position
if (!hasLazyLoaded.value) {
  const { stop } = useMutationObserver(
    containerRef,
    (mutations) => {
      hash.value &&
        mutations.forEach((mutation) => {
          if (mutation.type !== 'childList') {
            return
          }

          const targetId = hash.value
          const foundElement = window.document.getElementById(targetId)

          if (foundElement && !unfreeze.value) {
            unfreeze.value = freezeElement(foundElement as HTMLElement)
            scrollToId(targetId)
            stop()
          }
        })
    },
    {
      childList: true,
      subtree: true,
    },
  )
}
</script>

<template>
  <div
    v-if="items.entries.length && activeCollection"
    ref="container">
    <!-- Use recursive component for cleaner rendering -->
    <TraversedEntry
      :entries="items.entries"
      :document="document"
      :config="config"
      :activeCollection="activeCollection"
      :activeServer="activeServer"
      :store="store" />
  </div>
</template>
