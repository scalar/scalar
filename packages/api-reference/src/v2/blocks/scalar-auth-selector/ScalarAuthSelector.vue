<script setup lang="ts">
// TODO: Get rid of the API Client store
import { useActiveEntities, useWorkspace } from '@scalar/api-client/store'
import { RequestAuth } from '@scalar/api-client/views/Request/RequestSection/RequestAuth'
import { getSlugUid } from '@scalar/oas-utils/transforms'
import type { ApiReferenceConfiguration } from '@scalar/types'
import { computed } from 'vue'

import { IntroductionCardItem } from '@/components/IntroductionCard'

const { config } = defineProps<{
  config?: ApiReferenceConfiguration
}>()

const { collections, securitySchemes, servers } = useWorkspace()
const {
  activeCollection: _activeCollection,
  activeEnvVariables,
  activeEnvironment,
  activeWorkspace,
} = useActiveEntities()

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
  <IntroductionCardItem
    v-if="
      activeCollection &&
      activeWorkspace &&
      Object.keys(securitySchemes ?? {}).length
    "
    class="scalar-reference-intro-auth scalar-client leading-normal">
    <RequestAuth
      :collection="activeCollection"
      :envVariables="activeEnvVariables"
      :environment="activeEnvironment"
      layout="reference"
      :persistAuth="config?.persistAuth"
      :selectedSecuritySchemeUids="
        activeCollection?.selectedSecuritySchemeUids ?? []
      "
      :server="activeServer"
      title="Authentication"
      :workspace="activeWorkspace" />
  </IntroductionCardItem>
</template>
