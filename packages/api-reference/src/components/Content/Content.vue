<script setup lang="ts">
import { useActiveEntities, useWorkspace } from '@scalar/api-client/store'
import { getSlugUid } from '@scalar/oas-utils/transforms'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Spec } from '@scalar/types/legacy'
import { computed } from 'vue'

import { IntroductionSection } from '@/components/Content/Introduction'
import { ModelsSection } from '@/components/Content/Models'
import { SectionFlare } from '@/components/SectionFlare'
import { useConfig } from '@/hooks/useConfig'

import { Loading } from './Lazy'
import { OperationsSection } from './Operations'
import { WebhooksSection } from './Webhooks'

withDefaults(
  defineProps<{
    document: OpenAPIV3_1.Document
    parsedSpec: Spec
    layout?: 'modern' | 'classic'
  }>(),
  {
    layout: 'modern',
  },
)

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
    <Loading
      v-if="activeCollection"
      :document="document"
      :collection="activeCollection"
      :layout="layout"
      :parsedSpec="parsedSpec"
      :server="activeServer" />

    <!-- Introduction -->
    <IntroductionSection
      v-if="document?.info?.title || document?.info?.description"
      :document="document"
      :layout="layout"
      :config="config" />
    <!-- Empty State -->
    <slot
      v-else
      name="empty-state" />

    <!-- Operations -->
    <OperationsSection
      :document="document"
      :layout="layout"
      :config="config" />

    <!-- Webhooks -->
    <WebhooksSection
      :document="document"
      :parsedSpec="parsedSpec"
      :layout="layout"
      :config="config" />

    <!-- Models -->
    <ModelsSection
      v-if="!config?.hideModels"
      :document="document"
      :parsedSpec="parsedSpec"
      :layout="layout" />
    <slot name="end" />
  </div>
</template>

<style>
.narrow-references-container {
  container-name: narrow-references-container;
  container-type: inline-size;
}
</style>
