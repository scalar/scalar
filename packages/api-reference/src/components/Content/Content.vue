<script setup lang="ts">
import { generateClientOptions } from '@scalar/api-client/v2/blocks/operation-code-sample'
import { ScalarErrorBoundary } from '@scalar/components'
import type { Server } from '@scalar/oas-utils/entities/spec'
import type { ApiReferenceConfiguration, Heading } from '@scalar/types'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { TraversedEntry as TraversedEntryType } from '@scalar/workspace-store/schemas/navigation'
import type {
  Workspace,
  WorkspaceDocument,
} from '@scalar/workspace-store/schemas/workspace'
import { computed } from 'vue'

import { AuthSelector } from '@/blocks/scalar-auth-selector-block'
import { ClientSelector } from '@/blocks/scalar-client-selector-block'
import { InfoBlock } from '@/blocks/scalar-info-block'
import { IntroductionCardItem } from '@/blocks/scalar-info-block/'
import { ServerSelector } from '@/blocks/scalar-server-selector-block'
import TraversedEntry from '@/components/Content/Operations/TraversedEntry.vue'
import Lazy from '@/components/Lazy/Lazy.vue'
import { RenderPlugins } from '@/components/RenderPlugins'
import { SectionFlare } from '@/components/SectionFlare'
import { getXKeysFromObject } from '@/features/specification-extension'
import { firstLazyLoadComplete } from '@/helpers/lazy-bus'
import type { SecuritySchemeGetter } from '@/helpers/map-config-to-client-store'

const { options, document, items } = defineProps<{
  activeServer: Server | undefined
  infoSectionId: string
  document: WorkspaceDocument | undefined
  xScalarDefaultClient: Workspace['x-scalar-default-client']
  getSecuritySchemes: SecuritySchemeGetter
  items: TraversedEntryType[]
  expandedItems: Record<string, boolean>
  eventBus: WorkspaceEventBus
  options: {
    hiddenClients: ApiReferenceConfiguration['hiddenClients']
    layout: 'modern' | 'classic'
    persistAuth: boolean
    showOperationId?: boolean | undefined
    hideTestRequestButton: boolean | undefined
    expandAllResponses?: boolean
    expandAllModelSections: boolean | undefined
    orderRequiredPropertiesFirst: boolean | undefined
    orderSchemaPropertiesBy: 'alpha' | 'preserve' | undefined
    documentDownloadType: ApiReferenceConfiguration['documentDownloadType']
    headingSlugGenerator: (heading: Heading) => string
  }
}>()

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
</script>
<template>
  <SectionFlare />

  <div class="narrow-references-container">
    <slot name="start" />

    <!-- Introduction -->
    <Lazy :id="infoSectionId">
      <InfoBlock
        :id="infoSectionId"
        :documentExtensions
        :eventBus="eventBus"
        :externalDocs="document?.externalDocs"
        :info="document?.info"
        :infoExtensions
        :layout="options.layout"
        :oasVersion="document?.['x-original-oas-version']"
        :options="{
          headingSlugGenerator: options.headingSlugGenerator,
          documentDownloadType: options.documentDownloadType,
          layout: options.layout,
        }">
        <template #selectors>
          <ScalarErrorBoundary>
            <IntroductionCardItem
              v-if="document?.servers?.length"
              class="scalar-reference-intro-server scalar-client introduction-card-item text-base leading-normal [--scalar-address-bar-height:0px]">
              <ServerSelector
                :servers="document?.servers ?? []"
                :xSelectedServer="document?.['x-scalar-active-server']" />
            </IntroductionCardItem>
          </ScalarErrorBoundary>
          <ScalarErrorBoundary>
            <!-- Auth selector currently requires an active collection -->
            <IntroductionCardItem
              v-if="document"
              class="scalar-reference-intro-auth scalar-client introduction-card-item leading-normal">
              <AuthSelector
                v-if="
                  Object.keys(document?.components?.securitySchemes ?? {})
                    .length
                "
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
    </Lazy>

    <!-- Render traversed operations and webhooks -->
    <!-- Use recursive component for cleaner rendering -->
    <TraversedEntry
      v-if="items.length"
      :activeServer
      :entries="items"
      :eventBus="eventBus"
      :expandedItems="expandedItems"
      :getSecuritySchemes="getSecuritySchemes"
      :options="{
        layout: options.layout ?? 'modern',
        showOperationId: options.showOperationId,
        hideTestRequestButton: options.hideTestRequestButton,
        expandAllResponses: options.expandAllResponses,
        clientOptions: clientOptions,
        orderRequiredPropertiesFirst: options.orderRequiredPropertiesFirst,
        orderSchemaPropertiesBy: options.orderSchemaPropertiesBy,
        expandAllModelSections: options.expandAllModelSections,
      }"
      :paths="document?.paths ?? {}"
      :schemas="document?.components?.schemas ?? {}"
      :security="document?.security"
      :webhooks="document?.webhooks ?? {}"
      :xScalarDefaultClient="xScalarDefaultClient">
    </TraversedEntry>

    <!-- Render plugins at content.end view -->
    <RenderPlugins
      :options
      viewName="content.end" />

    <slot name="end" />
    <!-- Placeholder content to allow the active item to be scrolled to the top while the rest of the content is lazy loaded -->
    <div
      v-if="!firstLazyLoadComplete"
      class="h-dvh"></div>
  </div>
</template>

<style>
.narrow-references-container {
  container-name: narrow-references-container;
  container-type: inline-size;
}
</style>
