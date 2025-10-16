<script setup lang="ts">
import { generateClientOptions } from '@scalar/api-client/v2/blocks/operation-code-sample'
import { ScalarErrorBoundary } from '@scalar/components'
import type { Server } from '@scalar/oas-utils/entities/spec'
import type { ApiReferenceConfiguration } from '@scalar/types'
import { isOpenApiDocument } from '@scalar/workspace-store/helpers/type-guards'
import type { TraversedDescription } from '@scalar/workspace-store/schemas/navigation'
import type {
  Workspace,
  WorkspaceDocument,
} from '@scalar/workspace-store/schemas/workspace'
import { computed } from 'vue'

import IntroductionSection from '@/components/Content/IntroductionSection.vue'
import { Models } from '@/components/Content/Models'
import { getCurrentIndex } from '@/components/Content/Operations/get-current-index'
import TraversedEntry from '@/components/Content/Operations/TraversedEntry.vue'
import { RenderPlugins } from '@/components/RenderPlugins'
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
import type { SecuritySchemeGetter } from '@/v2/helpers/map-config-to-client-store'

const { options, document } = defineProps<{
  contentId: string
  activeServer: Server | undefined
  document: WorkspaceDocument | undefined
  xScalarDefaultClient: Workspace['x-scalar-default-client']
  getSecuritySchemes: SecuritySchemeGetter
  options: {
    slug: string | undefined
    hiddenClients: ApiReferenceConfiguration['hiddenClients']
    layout: 'modern' | 'classic'
    persistAuth: boolean
    showOperationId?: boolean | undefined
    hideTestRequestButton: boolean | undefined
    expandAllResponses?: boolean
    hideModels: boolean | undefined
    expandAllModelSections: boolean | undefined
    orderRequiredPropertiesFirst: boolean | undefined
    orderSchemaPropertiesBy: 'alpha' | 'preserve' | undefined
    documentDownloadType: ApiReferenceConfiguration['documentDownloadType']
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
const documentExtensions = computed(() => getXKeysFromObject(document))

// Computed property to get all OpenAPI extension fields from the document's info object
const infoExtensions = computed(() => getXKeysFromObject(document?.info))

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
    <IntroductionSection :showEmptyState="false">
      <InfoBlock
        :id="contentId"
        :documentExtensions
        :externalDocs="document?.externalDocs"
        :info="document?.info"
        :infoExtensions
        :layout="options.layout"
        :oasVersion="
          document && isOpenApiDocument(document)
            ? document['x-original-oas-version']
            : undefined
        "
        :options="{
          documentDownloadType: options.documentDownloadType,
          layout: options.layout,
        }">
        <template #selectors>
          <ScalarErrorBoundary>
            <IntroductionCardItem
              v-if="
                document &&
                isOpenApiDocument(document) &&
                document.servers?.length
              "
              class="scalar-reference-intro-server scalar-client introduction-card-item text-base leading-normal [--scalar-address-bar-height:0px]">
              <ServerSelector
                :servers="document.servers"
                :xSelectedServer="document?.['x-scalar-active-server']" />
            </IntroductionCardItem>
          </ScalarErrorBoundary>
          <ScalarErrorBoundary>
            <!-- Auth selector currently requires an active collection -->
            <IntroductionCardItem
              v-if="document"
              class="scalar-reference-intro-auth scalar-client introduction-card-item leading-normal">
              <AuthSelector
                layout="reference"
                :persistAuth="options.persistAuth"
                :server="activeServer"
                title="Authentication" />
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
                  document?.info?.['x-scalar-sdk-installation']
                "
                :xSelectedClient="xScalarDefaultClient" />
            </IntroductionCardItem>
          </ScalarErrorBoundary>
        </template>
      </InfoBlock>

      <template #empty-state>
        <slot name="empty-state" />
      </template>
    </IntroductionSection>

    <!-- Render traversed operations and webhooks -->
    <div v-if="document && isOpenApiDocument(document) && items.entries.length">
      <!-- Use recursive component for cleaner rendering -->
      <TraversedEntry
        :activeServer
        :entries="items.entries"
        :getSecuritySchemes="getSecuritySchemes"
        :hash="hash"
        :options="{
          layout: options.layout ?? 'modern',
          showOperationId: options.showOperationId,
          hideTestRequestButton: options.hideTestRequestButton,
          expandAllResponses: options.expandAllResponses,
          clientOptions: clientOptions,
          orderRequiredPropertiesFirst: options.orderRequiredPropertiesFirst,
          orderSchemaPropertiesBy: options.orderSchemaPropertiesBy,
        }"
        :paths="document?.paths ?? {}"
        :rootIndex
        :security="document?.security"
        :webhooks="document?.webhooks ?? {}"
        :xScalarDefaultClient="xScalarDefaultClient" />
    </div>

    <!-- Models -->
    <Models
      v-if="!options.hideModels && document && isOpenApiDocument(document)"
      :hash
      :models
      :options="{
        layout: options.layout ?? 'modern',
        expandAllModelSections: options.expandAllModelSections,
        orderRequiredPropertiesFirst: options.orderRequiredPropertiesFirst,
        orderSchemaPropertiesBy: options.orderSchemaPropertiesBy,
      }"
      :schemas="document?.components?.schemas" />

    <!-- Render plugins at content.end view -->
    <RenderPlugins
      :options
      viewName="content.end" />

    <slot name="end" />
  </div>
</template>

<style>
.narrow-references-container {
  container-name: narrow-references-container;
  container-type: inline-size;
}
</style>
