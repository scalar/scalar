<script setup lang="ts">
import type { ApiReferenceConfiguration } from '@scalar/types'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { IntroductionCard } from '@/components/IntroductionCard'
import { Lazy } from '@/components/Lazy'
import { useNavState } from '@/hooks/useNavState'

import IntroductionSection from './IntroductionSection.vue'

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

const { hash } = useNavState()
</script>
<template>
  <!-- Empty State -->
  <slot
    v-if="!document"
    name="empty-state" />

  <!-- Introduction -->
  <Lazy
    v-else
    id="introduction-card"
    prev
    :isLazy="Boolean(hash) && !hash.startsWith('description')">
    <IntroductionSection
      :document="document"
      :config="config">
      <template #[introCardsSlot]>
        <IntroductionCard :row="config?.layout === 'classic'">
          <slot name="selectors" />
        </IntroductionCard>
      </template>
    </IntroductionSection>
  </Lazy>
</template>
