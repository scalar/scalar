<script setup lang="ts">
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import type { Heading } from '@scalar/types/legacy'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type {
  ExternalDocumentationObject,
  InfoObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import DownloadLink from '@/blocks/scalar-info-block/components/DownloadLink.vue'

import IntroductionCard from './IntroductionCard.vue'
import IntroductionLayout from './IntroductionLayout.vue'

const {
  headingSlugGenerator,
  layout,
  eventBus,
  documentDownloadType = 'both',
} = defineProps<{
  /** Optional unique identifier for the info block. */
  id?: string
  /** Original openapi version of the input document */
  oasVersion?: string
  /** The Info object from the OpenAPI document. */
  info: InfoObject | undefined
  /** The external documentation object from the OpenAPI document, if present. */
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
}>()

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
    :documentExtensions
    :eventBus="eventBus"
    :externalDocs
    :headingSlugGenerator
    :info
    :infoExtensions
    :oasVersion>
    <template #[introCardsSlot]>
      <IntroductionCard :row="layout === 'classic'">
        <slot name="selectors" />
      </IntroductionCard>
    </template>
    <template #download-link>
      <DownloadLink
        :documentDownloadType
        :eventBus />
    </template>
  </IntroductionLayout>
</template>
