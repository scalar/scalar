<script setup lang="ts">
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ApiReferenceConfiguration } from '@scalar/types'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { computed } from 'vue'

import { Introduction } from '@/components/Content/Introduction'
import { Models } from '@/components/Content/Models'
import { SectionFlare } from '@/components/SectionFlare'
import { useConfig } from '@/hooks/useConfig'
import ClientSelector from '@/v2/blocks/scalar-client-selector-block/components/ClientSelector.vue'
import { generateClientOptions } from '@/v2/blocks/scalar-request-example-block/helpers/generate-client-options'
import ServerSelector from '@/v2/blocks/scalar-server-selector-block/components/ServerSelector.vue'

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
    <Introduction
      v-if="document?.info?.title || document?.info?.description"
      :document
      :store
      :config>
      <template #serverSelector>
        <div
          v-if="store.workspace.activeDocument?.servers?.length"
          class="scalar-reference-intro-server scalar-client introduction-card-item text-base leading-normal [--scalar-address-bar-height:0px]">
          <ServerSelector
            :servers="store.workspace.activeDocument?.servers ?? []"
            :xSelectedServer="
              store.workspace.activeDocument?.['x-scalar-active-server']
            " />
        </div>
      </template>
      <template #clientSelector>
        <ClientSelector
          v-if="config?.hiddenClients !== true && clientOptions.length"
          :clientOptions
          :xScalarSdkInstallation="
            store.workspace.activeDocument?.info?.['x-scalar-sdk-installation']
          "
          :xSelectedClient="store.workspace['x-scalar-default-client']"
          class="introduction-card-item scalar-reference-intro-clients" />
      </template>
    </Introduction>

    <!-- Empty State -->
    <slot
      v-else
      name="empty-state" />

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

.introduction-card-item {
  display: flex;
  margin-bottom: 12px;
  flex-direction: column;
  justify-content: start;
}
</style>
