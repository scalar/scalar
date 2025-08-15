<script setup lang="ts">
// TODO: Get rid of the API Client store
import { useActiveEntities, useWorkspace } from '@scalar/api-client/store'
import { getSlugUid } from '@scalar/oas-utils/transforms'
import type { ApiReferenceConfiguration } from '@scalar/types'
import { computed } from 'vue'

import { IntroductionCardItem } from '@/components/IntroductionCard'
import { BaseUrl } from '@/features/base-url'

const { config } = defineProps<{
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
  <IntroductionCardItem
    v-if="activeCollection?.servers?.length"
    class="scalar-reference-intro-server scalar-client text-base leading-normal [--scalar-address-bar-height:0px]">
    <BaseUrl
      :collection="activeCollection"
      :server="activeServer" />
  </IntroductionCardItem>
</template>
