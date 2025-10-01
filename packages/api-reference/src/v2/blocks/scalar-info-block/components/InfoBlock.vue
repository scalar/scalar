<script setup lang="ts">
import type { ApiReferenceConfiguration } from '@scalar/types'
import type {
  ExternalDocumentationObject,
  InfoObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import DownloadLink from '@/v2/blocks/scalar-info-block/components/DownloadLink.vue'

import IntroductionCard from './IntroductionCard.vue'
import IntroductionLayout from './IntroductionLayout.vue'

const { options } = defineProps<{
  /** Optional unique identifier for the info block. */
  id?: string
  /** Original openapi version of the input document */
  oasVersion?: string
  /** The Info object from the OpenAPI document. */
  info: InfoObject
  /** The external documentation object from the OpenAPI document, if present. */
  externalDocs?: ExternalDocumentationObject
  /** OpenAPI extension fields at the document level. */
  documentExtensions?: Record<string, unknown>
  /** OpenAPI extension fields at the info object level. */
  infoExtensions?: Record<string, unknown>

  options: {
    /** Indicates if the info block is in a loading state. */
    isLoading?: boolean
    /** Determines the layout style for the info block ('modern' or 'classic'). */
    layout?: 'modern' | 'classic'
    /** The document download type. */
    documentDownloadType?: ApiReferenceConfiguration['documentDownloadType']
    /** The URL of the OpenAPI document. */
    url?: string | undefined
    /** Optional callback invoked when the component has finished loading. */
    onLoaded?: () => void
    /** The original document content. */
    getOriginalDocument: () => string
  }
}>()

/**
 * Put the selectors in
 * - the after slot for classic layout,
 * - and the aside slot for other layouts.
 */
const introCardsSlot = computed(() =>
  options.layout === 'classic' ? 'after' : 'aside',
)
</script>

<template>
  <IntroductionLayout
    :id
    :documentExtensions
    :externalDocs
    :info
    :infoExtensions
    :isLoading="options.isLoading"
    :oasVersion
    :onLoaded="options.onLoaded">
    <template #[introCardsSlot]>
      <IntroductionCard :row="options.layout === 'classic'">
        <slot name="selectors" />
      </IntroductionCard>
    </template>
    <template #download-link>
      <DownloadLink
        :documentDownloadType="options.documentDownloadType ?? 'both'"
        :getOriginalDocument="options.getOriginalDocument"
        :title="info?.title"
        :url="options.url" />
    </template>
  </IntroductionLayout>
</template>
