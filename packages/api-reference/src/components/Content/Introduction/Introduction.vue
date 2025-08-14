<script setup lang="ts">
import { ScalarErrorBoundary } from '@scalar/components'
import type { ApiReferenceConfiguration } from '@scalar/types'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { computed } from 'vue'

import ScalarAuthSelector from '@/components/Content/Introduction/ScalarAuthSelector.vue'
import { Lazy } from '@/components/Lazy'
import { useNavState } from '@/hooks/useNavState'
import { ScalarClientSelector } from '@/v2/blocks/scalar-client-selector'
import type { ClientOptionGroup } from '@/v2/blocks/scalar-request-example-block/types'

import IntroductionSection from './IntroductionSection.vue'
import ScalarServerSelector from './ScalarServerSelector.vue'

const { config, store } = defineProps<{
  config?: ApiReferenceConfiguration
  clientOptions: ClientOptionGroup[]
  store: WorkspaceStore
}>()

const introCardsSlot = computed(() =>
  config?.layout === 'classic' ? 'after' : 'aside',
)

const { hash } = useNavState()
</script>
<template>
  <!-- Empty State -->
  <slot
    v-if="!store.workspace.activeDocument"
    name="empty-state" />

  <!-- Introduction -->
  <Lazy
    v-else
    id="introduction-card"
    prev
    :isLazy="Boolean(hash) && !hash.startsWith('description')">
    <IntroductionSection
      :document="store.workspace.activeDocument"
      :config="config">
      <template #[introCardsSlot]>
        <div
          class="introduction-card"
          :class="{ 'introduction-card-row': config?.layout === 'classic' }">
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
              :selectedClient="store.workspace['x-scalar-default-client']"
              :document="store.workspace.activeDocument" />
          </ScalarErrorBoundary>
        </div>
      </template>
    </IntroductionSection>
  </Lazy>
</template>

<style scoped>
/* TODO: Check what needs to be moved */
.render-loading {
  height: calc(var(--full-height) - var(--refs-header-height));
  display: flex;
  align-items: center;
  justify-content: center;
}
.introduction-card {
  display: flex;
  flex-direction: column;
}
.introduction-card-item {
  display: flex;
  margin-bottom: 12px;
  flex-direction: column;
  justify-content: start;
}
.introduction-card-item:has(.description) :deep(.server-form-container) {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
.introduction-card-item :deep(.request-item) {
  border-bottom: 0;
}
.introduction-card-title {
  font-weight: var(--scalar-semibold);
  font-size: var(--scalar-mini);
  color: var(--scalar-color-3);
}
.introduction-card-row {
  gap: 24px;
}
@media (min-width: 600px) {
  .introduction-card-row {
    flex-flow: row wrap;
  }
}
.introduction-card-row > * {
  flex: 1;
}
@media (min-width: 600px) {
  .introduction-card-row > * {
    min-width: min-content;
  }
}
@media (max-width: 600px) {
  .introduction-card-row > * {
    max-width: 100%;
  }
}
@container (max-width: 900px) {
  .introduction-card-row {
    flex-direction: column;
    align-items: stretch;
    gap: 0px;
  }
}
.introduction-card :deep(.security-scheme-label) {
  text-transform: uppercase;
  font-weight: var(--scalar-semibold);
}

.references-classic
  .introduction-card-row
  :deep(.scalar-card:nth-of-type(2) .scalar-card-header) {
  display: none;
}
.references-classic
  .introduction-card-row
  :deep(.scalar-card:nth-of-type(2) .scalar-card-header) {
  display: none;
}
.references-classic
  .introduction-card-row
  :deep(
    .scalar-card:nth-of-type(2)
      .scalar-card-header.scalar-card--borderless
      + .scalar-card-content
  ) {
  margin-top: 0;
}
</style>
