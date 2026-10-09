<script setup lang="ts">
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import type { AsyncApiInfoObject } from '@scalar/types/asyncapi/3.1'
import type { Heading } from '@scalar/types/legacy'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  ExternalDocumentationObject,
  InfoObject,
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { computed } from 'vue'

import DownloadLink from '@/blocks/scalar-info-block/components/DownloadLink.vue'

import IntroductionCard from './IntroductionCard.vue'
import IntroductionLayout from './IntroductionLayout.vue'

const {
  headingSlugGenerator,
  layout,
  eventBus,
  documentDownloadType = 'both',
  documentUrl,
  documentType,
  info,
  externalDocs,
} = defineProps<{
  /** Optional unique identifier for the info block. */
  id?: string
  /** AsyncAPI application identifier, separate from the introduction navigation anchor. */
  applicationIdentifier?: string
  /** Original specification version of the input document (OpenAPI or AsyncAPI). */
  specificationVersion?: string
  /** The Info object from the API description. */
  info: InfoObject | AsyncApiInfoObject | undefined
  /** An explicit external documentation object, overriding AsyncAPI info.externalDocs. */
  externalDocs?: ExternalDocumentationObject
  /** OpenAPI extension fields at the document level. */
  documentExtensions?: Record<string, unknown>
  /** OpenAPI extension fields at the info object level. */
  infoExtensions?: Record<string, unknown>
  /** The event bus for the handling all events. */
  eventBus: WorkspaceEventBus
  /** Heading id generator for Markdown headings */
  headingSlugGenerator: (heading: Heading) => string
  /** Determines the layout style for the info block ('modern' or 'classic'). */
  layout?: 'modern' | 'classic'
  /** The document download type. */
  documentDownloadType?: ApiReferenceConfiguration['documentDownloadType']
  /** URL of the OpenAPI document. Used when documentDownloadType is 'direct'. */
  documentUrl?: string
  /** The kind of document being rendered. Drives download button labels. */
  documentType?: 'openapi' | 'asyncapi'
}>()

/** AsyncAPI 3.x carries external documentation on info and allows references. */
const resolvedExternalDocs = computed<ExternalDocumentationObject | undefined>(
  () =>
    getResolvedRef(
      externalDocs ??
        (documentType === 'asyncapi' && info && 'externalDocs' in info
          ? info.externalDocs
          : undefined),
    ),
)

/**
 * Put the selectors in
 * - the after slot for classic layout,
 * - and the aside slot for other layouts.
 */
const introCardsSlot = computed(() =>
  layout === 'classic' ? 'after' : 'aside',
)
</script>

<template>
  <IntroductionLayout
    :id
    :applicationIdentifier
    :documentExtensions
    :documentType
    :eventBus="eventBus"
    :externalDocs="resolvedExternalDocs"
    :headingSlugGenerator
    :info
    :infoExtensions
    :specificationVersion>
    <template #[introCardsSlot]>
      <IntroductionCard :row="layout === 'classic'">
        <slot name="selectors" />
      </IntroductionCard>
    </template>
    <template #download-link>
      <DownloadLink
        :documentDownloadType
        :documentType
        :documentUrl
        :eventBus />
    </template>
  </IntroductionLayout>
</template>
