<script setup lang="ts">
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ApiReferenceConfiguration } from '@scalar/types'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { computed } from 'vue'

import { Introduction } from '@/components/Content/Introduction'
import { Models } from '@/components/Content/Models'
import { SectionFlare } from '@/components/SectionFlare'
import { useConfig } from '@/hooks/useConfig'
import { generateClientOptions } from '@/v2/blocks/scalar-request-example-block/helpers/generate-client-options'

import { TraversedEntryContainer } from './Operations'

const { store, document: oldDocument } = defineProps<{
  document: OpenAPIV3_1.Document
  config: ApiReferenceConfiguration
  store: WorkspaceStore
}>()

const config = useConfig()

/**
 * Generate all client options so that it can be shared between the top client picker and the operations
 */
const clientOptions = computed(() =>
  generateClientOptions(config.value.hiddenClients),
)

/**
 * Active Document
 *
 * We computed it here instead of using activeDocument in case we want to handle multiple active documents
 */
const document = computed(() => store.workspace.activeDocument)
</script>
<template>
  <SectionFlare />

  <div
    class="narrow-references-container"
    v-if="document">
    <slot name="start" />

    <!-- Introduction -->
    <Introduction
      v-if="document?.info?.title || document?.info?.description"
      :document="oldDocument"
      :store
      :clientOptions
      :config />

    <!-- Empty State -->
    <slot
      v-else
      name="empty-state" />

    <!-- Loop on traversed entries -->
    <TraversedEntryContainer
      :config
      :document
      :clientOptions
      :store />

    <!-- Models -->
    <Models
      v-if="!config?.hideModels"
      :document="document"
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
