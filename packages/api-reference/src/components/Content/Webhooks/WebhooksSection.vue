<script setup lang="ts">
import { useActiveEntities, useWorkspace } from '@scalar/api-client/store'
import { getSlugUid } from '@scalar/oas-utils/transforms'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ApiReferenceConfiguration } from '@scalar/types'
import type { Spec } from '@scalar/types/legacy'
import { computed } from 'vue'

import { TagList } from '../Tags'

const { document, parsedSpec, layout, config } = defineProps<{
  document: OpenAPIV3_1.Document
  parsedSpec: Spec
  layout: 'modern' | 'classic'
  config?: ApiReferenceConfiguration
}>()

const { collections, servers } = useWorkspace()
const { activeCollection: _activeCollection } = useActiveEntities()

/** Match the collection by slug if provided */
const activeCollection = computed(() => {
  if (config?.slug) {
    const collection = collections[getSlugUid(config.slug)]
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
  <template v-if="parsedSpec.webhooks?.length && activeCollection">
    <TagList
      :document="document"
      id="webhooks"
      :collection="activeCollection"
      :layout="layout"
      :server="activeServer"
      :spec="parsedSpec"
      :tags="[
        {
          name: 'Webhooks',
          description: '',
          operations: parsedSpec.webhooks,
        },
      ]">
    </TagList>
  </template>
</template>
