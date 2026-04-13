<script setup lang="ts">
import { generateClientOptions } from '@scalar/api-client/v2/blocks/operation-code-sample'
import { mapHiddenClientsConfig } from '@scalar/api-client/v2/features/modal'
import { ScalarErrorBoundary } from '@scalar/components'
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import type { Heading } from '@scalar/types/legacy'
import type { AuthStore } from '@scalar/workspace-store/entities/auth'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import {
  getSelectedServer,
  getServers,
  mergeSecurity,
} from '@scalar/workspace-store/request-example'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { TraversedEntry as TraversedEntryType } from '@scalar/workspace-store/schemas/navigation'
import type {
  Workspace,
  WorkspaceDocument,
} from '@scalar/workspace-store/schemas/workspace'
import { computed, onMounted } from 'vue'

import { ClientSelector } from '@/blocks/scalar-client-selector-block'
import { InfoBlock } from '@/blocks/scalar-info-block'
import { IntroductionCardItem } from '@/blocks/scalar-info-block/'
import { ServerSelector } from '@/blocks/scalar-server-selector-block'
import { Auth } from '@/components/Content/Auth'
import TraversedEntry from '@/components/Content/Operations/TraversedEntry.vue'
import { RenderPlugins } from '@/components/RenderPlugins'
import { SectionFlare } from '@/components/SectionFlare'
import { getXKeysFromObject } from '@/features/specification-extension'
import {
  firstLazyLoadComplete,
  scheduleInitialLoadComplete,
} from '@/helpers/lazy-bus'

const {
  document,
  clientDocument,
  items,
  environment,
  eventBus,
  options,
  authStore,
} = defineProps<{
  infoSectionId: string
  /** The subset of the configuration object required for the content component */
  options: Pick<
    ApiReferenceConfigurationRaw,
    | 'authentication'
    | 'baseServerURL'
    | 'documentDownloadType'
    | 'expandAllResponses'
    | 'hiddenClients'
    | 'hideTestRequestButton'
    | 'layout'
    | 'orderRequiredPropertiesFirst'
    | 'orderSchemaPropertiesBy'
    | 'persistAuth'
    | 'proxyUrl'
    | 'servers'
    | 'showOperationId'
    | 'hideModels'
  >
  document: WorkspaceDocument | undefined
  clientDocument: WorkspaceDocument | undefined
  authStore: AuthStore
  xScalarDefaultClient: Workspace['x-scalar-default-client']
  items: TraversedEntryType[]
  expandedItems: Record<string, boolean>
  eventBus: WorkspaceEventBus
  environment: XScalarEnvironment
  /** Heading id generator for Markdown headings */
  headingSlugGenerator: (heading: Heading) => string
}>()

/** Generate all client options so that it can be shared between the top client picker and the operations */
const clientOptions = computed(() =>
  generateClientOptions(mapHiddenClientsConfig(options.hiddenClients)),
)

/** Computed property to get all OpenAPI extension fields from the root document object */
const documentExtensions = computed(() => getXKeysFromObject(document))

/** Computed property to get all OpenAPI extension fields from the document's info object */
const infoExtensions = computed(() => getXKeysFromObject(document?.info))

/** Compute the servers for the document */
const servers = computed(() =>
  getServers(options?.servers ?? clientDocument?.servers, {
    baseServerUrl: options?.baseServerURL,
    documentUrl: clientDocument?.['x-scalar-original-source-url'],
  }),
)

/** Compute the selected server for the document only (for now) */
const selectedServer = computed(() =>
  getSelectedServer(clientDocument ?? null, null, null, servers.value),
)

/** Merge authentication config with the document security schemes */
const securitySchemes = computed(() =>
  mergeSecurity(
    clientDocument?.components?.securitySchemes,
    options.authentication?.securitySchemes,
    authStore,
    clientDocument?.['x-scalar-navigation']?.name ?? '',
  ),
)

/** Ensures firstLazyLoadComplete is set for documents with no Lazy sections (e.g. no operations/tags/models). */
onMounted(() => {
  scheduleInitialLoadComplete()
})
</script>
<template>
  <SectionFlare />

  <div class="narrow-references-container">
    <slot name="start" />

    <!-- Introduction -->

    <InfoBlock
      :id="infoSectionId"
      :documentDownloadType="options.documentDownloadType"
      :documentExtensions
      :documentUrl="document?.['x-scalar-original-source-url']"
      :eventBus
      :externalDocs="document?.externalDocs"
      :headingSlugGenerator
      :info="document?.info"
      :infoExtensions
      :layout="options.layout"
      :oasVersion="document?.['x-original-oas-version']">
      <template #selectors>
        <!-- Server Selector -->
        <ScalarErrorBoundary>
          <IntroductionCardItem
            v-if="servers?.length"
            class="scalar-reference-intro-server scalar-client introduction-card-item text-base leading-normal [--scalar-address-bar-height:0px]">
            <ServerSelector
              :eventBus
              :selectedServer
              :servers />
          </IntroductionCardItem>
        </ScalarErrorBoundary>

        <!-- Auth selector -->
        <ScalarErrorBoundary>
          <IntroductionCardItem
            v-if="document && !options.hideTestRequestButton"
            class="scalar-reference-intro-auth scalar-client introduction-card-item leading-normal">
            <Auth
              :authStore
              :document="clientDocument"
              :environment
              :eventBus
              :options
              :securitySchemes
              :selectedServer />
          </IntroductionCardItem>
        </ScalarErrorBoundary>

        <!-- Client selector -->
        <ScalarErrorBoundary>
          <IntroductionCardItem
            v-if="clientOptions.length"
            class="introduction-card-item scalar-reference-intro-clients">
            <ClientSelector
              class="introduction-card-item scalar-reference-intro-clients"
              :clientOptions
              :eventBus
              :selectedClient="xScalarDefaultClient"
              :xScalarSdkInstallation="
                document?.info?.['x-scalar-sdk-installation']
              " />
          </IntroductionCardItem>
        </ScalarErrorBoundary>
      </template>
    </InfoBlock>

    <!-- Render traversed operations and webhooks -->
    <!-- Use recursive component for cleaner rendering -->
    <TraversedEntry
      v-if="items.length && document"
      :authStore
      :clientOptions
      :document
      :entries="items"
      :eventBus
      :expandedItems
      :options
      :securitySchemes
      :selectedClient="xScalarDefaultClient"
      :selectedServer>
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
