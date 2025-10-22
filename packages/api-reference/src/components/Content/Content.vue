<script setup lang="ts">
import { generateClientOptions } from '@scalar/api-client/v2/blocks/operation-code-sample'
import { ScalarErrorBoundary } from '@scalar/components'
import type { Server } from '@scalar/oas-utils/entities/spec'
import type { ApiReferenceConfiguration, Heading } from '@scalar/types'
import type { TraversedEntry as TraversedEntryType } from '@scalar/workspace-store/schemas/navigation'
import type {
  Workspace,
  WorkspaceDocument,
} from '@scalar/workspace-store/schemas/workspace'
import { computed } from 'vue'

import TraversedEntry from '@/components/Content/Operations/TraversedEntry.vue'
import IntersectionObserver from '@/components/IntersectionObserver.vue'
import Lazy from '@/components/Lazy/Lazy.vue'
import { firstLazyLoadComplete } from '@/components/Lazy/lazyBus'
import { RenderPlugins } from '@/components/RenderPlugins'
import { SectionFlare } from '@/components/SectionFlare'
import { getXKeysFromObject } from '@/features/specification-extension'
import { AuthSelector } from '@/v2/blocks/scalar-auth-selector-block'
import { ClientSelector } from '@/v2/blocks/scalar-client-selector-block'
import { InfoBlock } from '@/v2/blocks/scalar-info-block'
import { IntroductionCardItem } from '@/v2/blocks/scalar-info-block/'
import { ServerSelector } from '@/v2/blocks/scalar-server-selector-block'
import type { SecuritySchemeGetter } from '@/v2/helpers/map-config-to-client-store'

const { options, document, items } = defineProps<{
  activeServer: Server | undefined
  infoSectionId: string
  document: WorkspaceDocument | undefined
  xScalarDefaultClient: Workspace['x-scalar-default-client']
  getSecuritySchemes: SecuritySchemeGetter
  items: TraversedEntryType[]
  expandedItems: Record<string, boolean>
  options: {
    slug: string | undefined
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

const emit = defineEmits<{
  (e: 'intersecting', id: string): void
  (e: 'toggleTag', id: string, open: boolean): void
  (e: 'toggleSchema', id: string, open: boolean): void
  (e: 'toggleOperation', id: string, open: boolean): void
  (e: 'scrollToId', id: string): void
  (e: 'copyAnchorUrl', id: string): void
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
      :xScalarDefaultClient="xScalarDefaultClient"
      @copyAnchorUrl="(id) => emit('copyAnchorUrl', id)"
      @intersecting="(id) => emit('intersecting', id)"
      @scrollToId="(id) => emit('scrollToId', id)"
      @toggleOperation="(id, open) => emit('toggleOperation', id, open)"
      @toggleSchema="(id, open) => emit('toggleSchema', id, open)"
      @toggleTag="(id, open) => emit('toggleTag', id, open)">
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
