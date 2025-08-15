<script setup lang="ts">
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { IntroductionCard } from '@/components/IntroductionCard'

import IntroductionLayout from './IntroductionLayout.vue'

const { layout } = defineProps<{
  layout?: 'modern' | 'classic'
  document?: OpenApiDocument
  id?: string
  isLoading?: boolean
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
    v-if="document"
    :id
    :document
    :onLoaded
    :isLoading>
    <template #[introCardsSlot]>
      <IntroductionCard :row="layout === 'classic'">
        <slot name="selectors" />
      </IntroductionCard>
    </template>
  </IntroductionLayout>
</template>
