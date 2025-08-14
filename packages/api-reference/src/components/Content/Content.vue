<script setup lang="ts">
import { ScalarErrorBoundary } from '@scalar/components'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ApiReferenceConfiguration } from '@scalar/types'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { computed } from 'vue'

import { Models } from '@/components/Content/Models'
import { SectionFlare } from '@/components/SectionFlare'
import { useConfig } from '@/hooks/useConfig'
import { ScalarAuthSelector } from '@/v2/blocks/scalar-auth-selector'
import { ScalarClientSelector } from '@/v2/blocks/scalar-client-selector'
import { ScalarDocumentInfo } from '@/v2/blocks/scalar-document-info'
import { generateClientOptions } from '@/v2/blocks/scalar-request-example-block/helpers/generate-client-options'
import { ScalarServerSelector } from '@/v2/blocks/scalar-server-selector'

import { TraversedEntryContainer } from './Operations'

defineProps<{
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
</script>
<template>
  <SectionFlare />

  <div class="narrow-references-container">
    <slot name="start" />

    <!-- Introduction -->
    <ScalarDocumentInfo
      :document="store.workspace.activeDocument"
      :clientOptions
      :defaultClient="store.workspace['x-scalar-default-client']"
      :config>
      <template #empty-state>
        <slot name="empty-state" />
      </template>
      <template #selectors>
        <ScalarErrorBoundary>
          <ScalarServerSelector :config="config" />
        </ScalarErrorBoundary>
        <ScalarErrorBoundary>
          <ScalarAuthSelector :config="config" />
        </ScalarErrorBoundary>
        <ScalarErrorBoundary>
          <ScalarClientSelector
            :config="config"
            :clientOptions="clientOptions"
            :selectedClient="store.workspace['x-scalar-default-client']"
            :document="store.workspace.activeDocument" />
        </ScalarErrorBoundary>
      </template>
    </ScalarDocumentInfo>

    <!-- Loop on traversed entries -->
    <TraversedEntryContainer
      :document
      :config
      :clientOptions
      :store />

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
