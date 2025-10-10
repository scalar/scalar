<script setup lang="ts">
import { useActiveEntities, useWorkspace } from '@scalar/api-client/store'
import { generateClientOptions } from '@scalar/api-client/v2/blocks/operation-code-sample'
import { ScalarErrorBoundary } from '@scalar/components'
import { getSlugUid } from '@scalar/oas-utils/transforms'
import type { ApiReferenceConfiguration } from '@scalar/types'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { TraversedDescription } from '@scalar/workspace-store/schemas/navigation'
import { computed } from 'vue'

import IntroductionSection from '@/components/Content/IntroductionSection.vue'
import { Models } from '@/components/Content/Models'
import { getCurrentIndex } from '@/components/Content/Operations/get-current-index'
import TraversedEntry from '@/components/Content/Operations/TraversedEntry.vue'
import { SectionFlare } from '@/components/SectionFlare'
import { getXKeysFromObject } from '@/features/specification-extension'
import { useFreezing } from '@/hooks/useFreezing'
import { useNavState } from '@/hooks/useNavState'
import { AuthSelector } from '@/v2/blocks/scalar-auth-selector-block'
import { ClientSelector } from '@/v2/blocks/scalar-client-selector-block'
import { InfoBlock } from '@/v2/blocks/scalar-info-block'
import { IntroductionCardItem } from '@/v2/blocks/scalar-info-block/'
import { ServerSelector } from '@/v2/blocks/scalar-server-selector-block'
import { useSidebar } from '@/v2/blocks/scalar-sidebar-block'

const { store, options } = defineProps<{
  contentId: string
  store: WorkspaceStore
  options: {
    isLoading: boolean | undefined
    slug: string | undefined
    hiddenClients: ApiReferenceConfiguration['hiddenClients']
    layout: 'modern' | 'classic'
    onLoaded: (() => void) | undefined
    persistAuth: boolean
    showOperationId?: boolean | undefined
    hideTestRequestButton: boolean | undefined
    expandAllResponses?: boolean
    hideModels: boolean | undefined
    expandAllModelSections: boolean | undefined
    orderRequiredPropertiesFirst: boolean | undefined
    orderSchemaPropertiesBy: 'alpha' | 'preserve' | undefined
    documentDownloadType: ApiReferenceConfiguration['documentDownloadType']
    url: string | undefined
    onShowMore: ((id: string) => void) | undefined
  }
}>()

useFreezing()

/**
 * Generate all client options so that it can be shared between the top client picker and the operations
 */
const clientOptions = computed(() =>
  generateClientOptions(options.hiddenClients),
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
  if (options.slug) {
    const collection = collections[getSlugUid(options.slug)]
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

const getOriginalDocument = () => store.exportActiveDocument('json') ?? '{}'

// const { collections, servers } = useWorkspace()
// const { activeCollection: _activeCollection } = useActiveEntities()

const { items } = useSidebar()
const { hash } = useNavState()

/** The index of the root entry */
const rootIndex = computed(() =>
  getCurrentIndex(hash.value, items.value.entries),
)

const models = computed<TraversedDescription | undefined>(() => {
  const item = items.value.entries.find((i) => i.id === 'models')

  return item && item.type === 'text' ? item : undefined
})
</script>
<template>
  <SectionFlare />

  <div class="narrow-references-container">
    <slot name="start" />

    <!-- Introduction -->
    <IntroductionSection :showEmptyState="!store.workspace.activeDocument">
      <InfoBlock
        v-if="store.workspace.activeDocument"
        :id="contentId"
        :aasVersion="store.workspace.activeDocument?.['asyncapi']"
        :documentExtensions
        :externalDocs="store.workspace.activeDocument.externalDocs"
        :info="store.workspace.activeDocument.info"
        :infoExtensions
        :layout="options.layout"
        :oasVersion="store.workspace.activeDocument?.['x-original-oas-version']"
        :options="{
          documentDownloadType: options.documentDownloadType,
          url: options.url,
          getOriginalDocument,
          isLoading: options.isLoading,
          layout: options.layout,
          onLoaded: options.onLoaded,
        }">
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
                :persistAuth="options.persistAuth"
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
              v-if="options.hiddenClients !== true && clientOptions.length"
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

    <!-- Render traversed operations and webhooks -->
    <div v-if="items.entries.length && activeCollection">
      <!-- Use recursive component for cleaner rendering -->
      <TraversedEntry
        :activeCollection
        :activeServer
        :entries="items.entries"
        :hash="hash"
        :options="{
          layout: options.layout ?? 'modern',
          showOperationId: options.showOperationId,
          hideTestRequestButton: options.hideTestRequestButton,
          expandAllResponses: options.expandAllResponses,
          clientOptions: clientOptions,
          orderRequiredPropertiesFirst: options.orderRequiredPropertiesFirst,
          orderSchemaPropertiesBy: options.orderSchemaPropertiesBy,
          onShowMore: options.onShowMore,
        }"
        :paths="store.workspace.activeDocument?.paths ?? {}"
        :rootIndex
        :security="store.workspace.activeDocument?.security"
        :store
        :webhooks="store.workspace.activeDocument?.webhooks ?? {}" />
    </div>

    <!-- Models -->
    <Models
      v-if="!options.hideModels && store.workspace.activeDocument"
      :hash
      :models
      :options="{
        layout: options.layout ?? 'modern',
        expandAllModelSections: options.expandAllModelSections,
        orderRequiredPropertiesFirst: options.orderRequiredPropertiesFirst,
        orderSchemaPropertiesBy: options.orderSchemaPropertiesBy,
        onShowMore: options.onShowMore,
      }"
      :schemas="store.workspace.activeDocument.components?.schemas" />

    <slot name="end" />
  </div>
</template>

<style>
.narrow-references-container {
  container-name: narrow-references-container;
  container-type: inline-size;
}
</style>
