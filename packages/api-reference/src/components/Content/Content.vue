<script setup lang="ts">
import { mapHiddenClientsConfig } from '@scalar/api-client/modal/map-hidden-clients-config'
import { generateClientOptions } from '@scalar/blocks/code-example'
import { ScalarErrorBoundary } from '@scalar/components/error-boundary'
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import type { Heading } from '@scalar/types/legacy'
import {
  getAsyncApiServers,
  getSelectedAsyncApiServer,
} from '@scalar/workspace-store/channel-example'
import type { AuthStore } from '@scalar/workspace-store/entities/auth'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import {
  getSelectedServer,
  getServers,
  mergeSecurity,
} from '@scalar/workspace-store/request-example'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { TraversedEntry as TraversedEntryType } from '@scalar/workspace-store/schemas/navigation'
import {
  getDocumentType,
  isAsyncApiDocument,
  isOpenApiDocument,
} from '@scalar/workspace-store/schemas/type-guards'
import type { ComponentsObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type {
  Workspace,
  WorkspaceDocument,
} from '@scalar/workspace-store/schemas/workspace'
import { computed, onMounted } from 'vue'

import { AsyncApiServerSelector } from '@/blocks/scalar-asyncapi-server-selector-block'
import { ClientSelector } from '@/blocks/scalar-client-selector-block'
import { InfoBlock } from '@/blocks/scalar-info-block'
import { IntroductionCardItem } from '@/blocks/scalar-info-block/'
import {
  getRenderableSdks,
  SdkInstallationInstructions,
} from '@/blocks/scalar-sdk-installation-instructions'
import { ServerSelector } from '@/blocks/scalar-server-selector-block'
import { AsyncApiTraversedEntry } from '@/components/Content/AsyncApi'
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
  documentSlug,
} = defineProps<{
  infoSectionId: string
  /** Slug of the active document, used to scope plugin view ids for navigation and deep-linking */
  documentSlug: string
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
    | 'oauth2RedirectUri'
    | 'orderRequiredPropertiesFirst'
    | 'orderSchemaPropertiesBy'
    | 'expandAllSchemaProperties'
    | 'persistAuth'
    | 'proxyUrl'
    | 'servers'
    | 'showOperationId'
    | 'hideModels'
    | 'modelsSectionLabel'
  >
  document: WorkspaceDocument | undefined
  clientDocument: WorkspaceDocument | undefined
  authStore: AuthStore
  xScalarDefaultClient: Workspace['x-scalar-default-client']
  xScalarDefaultExample: Workspace['x-scalar-default-example']
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

/**
 * Custom SDK installation instructions that actually have something to render.
 * Entries with only a `lang` are ignored so we can fall back to the client
 * selector instead of showing an empty card.
 */
const sdkInstallation = computed(() =>
  getRenderableSdks(openApiDocument.value?.info?.['x-scalar-sdk-installation']),
)

/**
 * Narrow the (possibly AsyncAPI) documents to OpenAPI documents. api-reference
 * is OpenAPI-native, so AsyncAPI fields surface as undefined/empty.
 */
const openApiDocument = computed(() =>
  isOpenApiDocument(document) ? document : undefined,
)
const openApiClientDocument = computed(() =>
  isOpenApiDocument(clientDocument) ? clientDocument : undefined,
)

/** AsyncAPI narrow, used to render the (currently channel-only) AsyncAPI content tree. */
const asyncApiDocument = computed(() =>
  isAsyncApiDocument(document) ? document : undefined,
)

/** AsyncAPI narrow of the client document, where server selection/variables are persisted. */
const asyncApiClientDocument = computed(() =>
  isAsyncApiDocument(clientDocument) ? clientDocument : undefined,
)

const documentType = computed(() => getDocumentType(document))

const specificationVersion = computed(() => {
  if (isAsyncApiDocument(document)) {
    return document['x-original-aas-version'] ?? document.asyncapi
  }
  return openApiDocument.value?.['x-original-oas-version']
})

/** Computed property to get all OpenAPI extension fields from the root document object */
const documentExtensions = computed(() => getXKeysFromObject(document))

/** Computed property to get all OpenAPI extension fields from the document's info object */
const infoExtensions = computed(() => getXKeysFromObject(document?.info))

/** Compute the servers for the document */
const servers = computed(() =>
  getServers(options?.servers ?? openApiClientDocument.value?.servers, {
    baseServerUrl: options?.baseServerURL,
    documentUrl: clientDocument?.['x-scalar-original-source-url'],
  }),
)

/** Compute the selected server for the document only (for now) */
const selectedServer = computed(() =>
  getSelectedServer(
    openApiClientDocument.value ?? null,
    null,
    null,
    servers.value,
  ),
)

/**
 * Compute the AsyncAPI servers (all protocols, not just WebSocket) for the
 * document-level server selector.
 */
const asyncApiServers = computed(() =>
  asyncApiClientDocument.value
    ? getAsyncApiServers(asyncApiClientDocument.value, { webSocketOnly: false })
    : [],
)

/** Compute the selected AsyncAPI server for the document */
const asyncApiSelectedServer = computed(() =>
  getSelectedAsyncApiServer(
    asyncApiClientDocument.value ?? null,
    asyncApiServers.value,
  ),
)

/** Merge authentication config with the document security schemes */
const securitySchemes = computed(() => {
  // AsyncAPI stores its security schemes in the same `components.securitySchemes` slot. The
  // scheme shapes overlap with OpenAPI for http/apiKey/oauth2/openIdConnect; broker-specific
  // types (scramSha*, plain, X509, …) flow through unchanged and degrade gracefully downstream.
  if (asyncApiClientDocument.value) {
    const components = asyncApiClientDocument.value.components
      ? getResolvedRef(asyncApiClientDocument.value.components)
      : undefined

    return mergeSecurity(
      components?.securitySchemes as ComponentsObject['securitySchemes'],
      options.authentication?.securitySchemes,
      authStore,
      asyncApiClientDocument.value['x-scalar-navigation']?.name ?? '',
      options.oauth2RedirectUri,
    )
  }

  return mergeSecurity(
    openApiClientDocument.value?.components?.securitySchemes,
    options.authentication?.securitySchemes,
    authStore,
    openApiClientDocument.value?.['x-scalar-navigation']?.name ?? '',
    options.oauth2RedirectUri,
  )
})

/**
 * Whether to show the document-level auth selector.
 *
 * For OpenAPI it stays tied to `hideTestRequestButton`, since the auth feeds the interactive
 * test client. AsyncAPI has no document-level test request, so its auth display is decoupled
 * from that flag and shown whenever a document is present.
 */
const showAuthSelector = computed(
  () =>
    Boolean(document) &&
    (Boolean(asyncApiDocument.value) || !options.hideTestRequestButton),
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

    <!-- Render plugins at content.start view -->
    <RenderPlugins
      :documentSlug
      :eventBus
      :options
      viewName="content.start" />

    <!-- Introduction -->

    <InfoBlock
      :id="infoSectionId"
      :documentDownloadType="options.documentDownloadType"
      :documentExtensions
      :documentType
      :documentUrl="document?.['x-scalar-original-source-url']"
      :eventBus
      :externalDocs="openApiDocument?.externalDocs"
      :headingSlugGenerator
      :info="document?.info"
      :infoExtensions
      :layout="options.layout"
      :specificationVersion>
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

        <!-- AsyncAPI Server Selector -->
        <ScalarErrorBoundary>
          <IntroductionCardItem
            v-if="asyncApiServers.length"
            class="scalar-reference-intro-server scalar-client introduction-card-item text-base leading-normal [--scalar-address-bar-height:0px]">
            <AsyncApiServerSelector
              :eventBus
              :selectedServer="asyncApiSelectedServer"
              :servers="asyncApiServers" />
          </IntroductionCardItem>
        </ScalarErrorBoundary>

        <!-- Auth selector -->
        <ScalarErrorBoundary>
          <IntroductionCardItem
            v-if="showAuthSelector"
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

        <!-- Custom SDK installation instructions, or the generic client selector -->
        <ScalarErrorBoundary>
          <IntroductionCardItem
            v-if="sdkInstallation.length"
            class="introduction-card-item scalar-reference-intro-clients">
            <SdkInstallationInstructions
              class="introduction-card-item scalar-reference-intro-clients"
              :eventBus
              :selectedClient="xScalarDefaultClient"
              :xScalarSdkInstallation="sdkInstallation" />
          </IntroductionCardItem>
          <IntroductionCardItem
            v-else-if="clientOptions.length && !asyncApiDocument"
            class="introduction-card-item scalar-reference-intro-clients">
            <ClientSelector
              class="introduction-card-item scalar-reference-intro-clients"
              :clientOptions
              :eventBus
              :selectedClient="xScalarDefaultClient" />
          </IntroductionCardItem>
        </ScalarErrorBoundary>
      </template>
    </InfoBlock>

    <!-- Render traversed operations and webhooks -->
    <!-- Use recursive component for cleaner rendering -->
    <TraversedEntry
      v-if="items.length && openApiDocument"
      :authStore
      :clientOptions
      :document="openApiDocument"
      :entries="items"
      :eventBus
      :expandedItems
      :options
      :securitySchemes
      :selectedClient="xScalarDefaultClient"
      :selectedExample="xScalarDefaultExample"
      :selectedServer>
    </TraversedEntry>

    <!-- AsyncAPI: render channels grouped by tag, mirroring the sidebar order. -->
    <AsyncApiTraversedEntry
      v-else-if="items.length && asyncApiDocument"
      :document="asyncApiDocument"
      :entries="items"
      :eventBus
      :expandedItems
      :options />

    <!-- Render plugins at content.end view -->
    <RenderPlugins
      :documentSlug
      :eventBus
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
