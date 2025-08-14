<script setup lang="ts">
import { ScalarErrorBoundary } from '@scalar/components'
import type { ApiReferenceConfiguration } from '@scalar/types'
import type { WorkspaceMeta } from '@scalar/workspace-store/schemas/schemas/workspace'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import IntroductionCard from '@/components/Content/Introduction/IntroductionCard.vue'
import ScalarAuthSelector from '@/components/Content/Introduction/ScalarAuthSelector.vue'
import { Lazy } from '@/components/Lazy'
import { useNavState } from '@/hooks/useNavState'
import { ScalarClientSelector } from '@/v2/blocks/scalar-client-selector'
import type { ClientOptionGroup } from '@/v2/blocks/scalar-request-example-block/types'

import IntroductionSection from './IntroductionSection.vue'
import ScalarServerSelector from './ScalarServerSelector.vue'

const { config } = defineProps<{
  config?: ApiReferenceConfiguration
  clientOptions: ClientOptionGroup[]
  document?: OpenApiDocument
  defaultClient?: WorkspaceMeta['x-scalar-default-client']
}>()

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
          <ScalarErrorBoundary>
            <ScalarServerSelector :config="config" />
          </ScalarErrorBoundary>
          <ScalarErrorBoundary>
            <ScalarAuthSelector :config="config" />
          </ScalarErrorBoundary>
          <ScalarErrorBoundary>
            <ScalarClientSelector
              :config="config"
              :clientOptions="clientOptions"
              :selectedClient="defaultClient"
              :document="document" />
          </ScalarErrorBoundary>
        </IntroductionCard>
      </template>
    </IntroductionSection>
  </Lazy>
</template>
