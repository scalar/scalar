<script setup lang="ts">
import type { ApiReferenceConfiguration } from '@scalar/types'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { IntroductionCard } from '@/components/IntroductionCard'

import IntroductionLayout from './IntroductionLayout.vue'

const { config } = defineProps<{
  config?: ApiReferenceConfiguration
  document?: OpenApiDocument
}>()

/**
 * Put the selectors in
 * - the after slot for classic layout,
 * - and the aside slot for other layouts.
 */
const introCardsSlot = computed(() =>
  config?.layout === 'classic' ? 'after' : 'aside',
)
</script>

<template>
  <IntroductionLayout
    v-if="document"
    :document="document"
    :config="config">
    <template #[introCardsSlot]>
      <IntroductionCard :row="config?.layout === 'classic'">
        <slot name="selectors" />
      </IntroductionCard>
    </template>
  </IntroductionLayout>
</template>
