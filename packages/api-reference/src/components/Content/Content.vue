<script setup lang="ts">
import { useActiveEntities, useWorkspace } from '@scalar/api-client/store'
import { ScalarErrorBoundary } from '@scalar/components'
import { getSlugUid } from '@scalar/oas-utils/transforms'
import type { ApiReferenceConfiguration } from '@scalar/types'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { computed } from 'vue'

import IntroductionSection from '@/components/Content/IntroductionSection.vue'
import { Models } from '@/components/Content/Models'
import { SectionFlare } from '@/components/SectionFlare'
import { getXKeysFromObject } from '@/features/specification-extension'
import { DEFAULT_INTRODUCTION_SLUG } from '@/features/traverse-schema'
import { useFreezing } from '@/hooks/useFreezing'
import { useNavState } from '@/hooks/useNavState'
import { AuthSelector } from '@/v2/blocks/scalar-auth-selector-block'
import { ClientSelector } from '@/v2/blocks/scalar-client-selector-block'
import { InfoBlock } from '@/v2/blocks/scalar-info-block'
import { IntroductionCardItem } from '@/v2/blocks/scalar-info-block/'
import { generateClientOptions } from '@/v2/blocks/scalar-request-example-block/helpers/generate-client-options'
import { ServerSelector } from '@/v2/blocks/scalar-server-selector-block'

import { TraversedEntryContainer } from './Operations'

const { store, config } = defineProps<{
  config: ApiReferenceConfiguration
  store: WorkspaceStore
}>()

useFreezing()

/**
 * Generate all client options so that it can be shared between the top client picker and the operations
 */
const clientOptions = computed(() =>
  generateClientOptions(config.hiddenClients),
)

const { getHeadingId } = useNavState()

const id = computed(() =>
  getHeadingId({
    slug: DEFAULT_INTRODUCTION_SLUG,
    depth: 1,
    value: 'Introduction',
  }),
)

// Computed property to get all OpenAPI extension fields from the root document object
const documentExtensions = computed(() =>
  getXKeysFromObject(store.workspace.activeDocument),
)

// Computed property to get all OpenAPI extension fields from the document's info object
const infoExtensions = computed(() =>
  getXKeysFromObject(store.workspace.activeDocument?.info),
)

/**
 * Should be removed after we migrate auth selector
 */
const { collections, securitySchemes, servers } = useWorkspace()
const {
  activeCollection: _activeCollection,
  activeEnvVariables,
  activeEnvironment,
  activeWorkspace,
} = useActiveEntities()

/** Match the collection by slug if provided */
const activeCollection = computed(() => {
  if (config.slug) {
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

const getOriginalDocument = () => store.exportActiveDocument('json') ?? '{}'
</script>
<template>
  <SectionFlare />

  <div class="narrow-references-container">
    <slot name="start" />

    <!-- Introduction -->
    <IntroductionSection :showEmptyState="!store.workspace.activeDocument">
      <InfoBlock
        v-if="store.workspace.activeDocument"
        :id
        :documentExtensions
        :externalDocs="store.workspace.activeDocument.externalDocs"
        :getOriginalDocument
        :info="store.workspace.activeDocument.info"
        :infoExtensions
        :isLoading="config.isLoading"
        :layout="config.layout"
        :oasVersion="store.workspace.activeDocument?.['x-original-oas-version']"
        :onLoaded="config.onLoaded">
        <template #selectors>
          <ScalarErrorBoundary>
            <IntroductionCardItem
              v-if="store.workspace.activeDocument?.servers?.length"
              class="scalar-reference-intro-server scalar-client introduction-card-item text-base leading-normal [--scalar-address-bar-height:0px]">
              <ServerSelector
                :servers="store.workspace.activeDocument?.servers ?? []"
                :xSelectedServer="
                  store.workspace.activeDocument?.['x-scalar-active-server']
                " />
            </IntroductionCardItem>
          </ScalarErrorBoundary>
          <ScalarErrorBoundary>
            <IntroductionCardItem
              v-if="
                activeCollection &&
                activeWorkspace &&
                Object.keys(securitySchemes ?? {}).length
              "
              class="scalar-reference-intro-auth scalar-client introduction-card-item leading-normal">
              <AuthSelector
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
          </ScalarErrorBoundary>
          <ScalarErrorBoundary>
            <IntroductionCardItem
              v-if="config?.hiddenClients !== true && clientOptions.length"
              class="introduction-card-item scalar-reference-intro-clients">
              <ClientSelector
                class="introduction-card-item scalar-reference-intro-clients"
                :clientOptions
                :xScalarSdkInstallation="
                  store.workspace.activeDocument?.info?.[
                    'x-scalar-sdk-installation'
                  ]
                "
                :xSelectedClient="store.workspace['x-scalar-default-client']" />
            </IntroductionCardItem>
          </ScalarErrorBoundary>
        </template>
      </InfoBlock>

      <template #empty-state>
        <slot name="empty-state" />
      </template>
    </IntroductionSection>

    <!-- Loop on traversed entries -->
    <TraversedEntryContainer
      v-if="store.workspace.activeDocument"
      :clientOptions
      :config
      :document="store.workspace.activeDocument"
      :store />

    <!-- Models -->
    <Models
      v-if="!config?.hideModels && store.workspace.activeDocument"
      :config
      :document="store.workspace.activeDocument" />

    <slot name="end" />
  </div>
</template>

<style>
.narrow-references-container {
  container-name: narrow-references-container;
  container-type: inline-size;
}
</style>
