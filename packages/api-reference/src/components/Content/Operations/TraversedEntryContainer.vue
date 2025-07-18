<script setup lang="ts">
import { useActiveEntities, useWorkspace } from '@scalar/api-client/store'
import { freezeElement } from '@scalar/helpers/dom/freeze-element'
import { getSlugUid } from '@scalar/oas-utils/transforms'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ApiReferenceConfiguration } from '@scalar/types'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { useMutationObserver } from '@vueuse/core'
import { computed, ref, useTemplateRef } from 'vue'

import { lazyIds } from '@/components/Lazy/lazyBus'
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
const containerRef = useTemplateRef('container')

/** Keeps track of our unfreeze function */
const unfreeze = ref<(() => void) | null>(null)

// We are waiting for the correct element to be loaded and we freeze the scroll position
const { stop } = useMutationObserver(
  containerRef,
  (mutations) => {
    hash.value &&
      mutations.forEach((mutation) => {
        if (mutation.type !== 'childList') {
          return
        }
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) {
            return
          }

          const targetId = hash.value
          const element = node as HTMLElement
          const foundElement = element.querySelector(`#${targetId}`)

          if (foundElement) {
            unfreeze.value = freezeElement(foundElement as HTMLElement)
          }
        })

        if (lazyIds.size === 0 && unfreeze.value) {
          console.log('stop')
          stop()
          setTimeout(() => {
            unfreeze.value?.()
            isIntersectionEnabled.value = true
          }, 300)
        }
      })
  },
  {
    childList: true,
    subtree: true,
  },
)
</script>

<template>
  <div
    ref="container"
    v-if="items.entries.length && activeCollection">
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
