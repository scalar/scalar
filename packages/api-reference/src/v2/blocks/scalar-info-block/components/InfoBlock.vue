<script setup lang="ts">
import type {
  ExternalDocumentationObject,
  InfoObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import IntroductionCard from './IntroductionCard.vue'
import IntroductionLayout from './IntroductionLayout.vue'

const { layout } = defineProps<{
  /** Optional unique identifier for the info block. */
  id?: string
  /** Determines the layout style for the info block ('modern' or 'classic'). */
  layout?: 'modern' | 'classic'
  /** Original openapi version of the input document */
  oasVersion?: string
  /** The original document content. */
  getOriginalDocument: () => string
  /** The Info object from the OpenAPI document. */
  info: InfoObject
  /** The external documentation object from the OpenAPI document, if present. */
  externalDocs?: ExternalDocumentationObject
  /** OpenAPI extension fields at the document level. */
  documentExtensions?: Record<string, unknown>
  /** OpenAPI extension fields at the info object level. */
  infoExtensions?: Record<string, unknown>
  /** Indicates if the info block is in a loading state. */
  isLoading?: boolean
  /** Optional callback invoked when the component has finished loading. */
  onLoaded?: () => void
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
    :externalDocs
    :getOriginalDocument
    :info
    :infoExtensions
    :isLoading
    :oasVersion
    :onLoaded>
    <template #[introCardsSlot]>
      <IntroductionCard :row="layout === 'classic'">
        <slot name="selectors" />
      </IntroductionCard>
    </template>
  </IntroductionLayout>
</template>
