<script setup lang="ts">
import { useActiveEntities, useWorkspace } from '@scalar/api-client/store'
import { getSlugUid } from '@scalar/oas-utils/transforms'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ApiReferenceConfiguration } from '@scalar/types'
import { computed } from 'vue'

import { Loading } from '@/components/Lazy'
import { Introduction } from '@/components/MainContent/Introduction'
import { Models } from '@/components/MainContent/Models'
import { SectionFlare } from '@/components/SectionFlare'
import { useConfig } from '@/hooks/useConfig'

import { OperationsAndWebhooks } from './Operations'

defineProps<{
  document: OpenAPIV3_1.Document
  config: ApiReferenceConfiguration
}>()

const config = useConfig()
const { collections, servers } = useWorkspace()
const { activeCollection: _activeCollection } = useActiveEntities()

/** Match the collection by slug if provided */
const activeCollection = computed(() => {
  if (config.value.slug) {
    const collection = collections[getSlugUid(config.value.slug)]
    if (collection) {
      return collection
    }
  }

  return _activeCollection.value
})

/** Ensure the server is the one selected in the collection */
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
</script>
<template>
  <SectionFlare />

  <div class="narrow-references-container">
    <slot name="start" />

    <!-- Loading State -->
    <!-- TODO: Fix -->
    <!-- <Loading
      v-if="activeCollection"
      :document
      :collection="activeCollection"
      :layout="layout"
      :parsedSpec="parsedSpec"
      :server="activeServer" /> -->

    <Introduction
      v-if="document?.info?.title || document?.info?.description"
      :document
      :config />
    <!-- Empty State -->
    <slot
      v-else
      name="empty-state" />

    <!-- Operations & Webhooks -->
    <OperationsAndWebhooks
      :document
      :config />

    <!-- Models -->
    <Models
      v-if="!config?.hideModels"
      :document
      :config />

    <slot name="end" />
  </div>
</template>

<style>
.narrow-references-container {
  container-name: narrow-references-container;
  container-type: inline-size;
}
</style>
