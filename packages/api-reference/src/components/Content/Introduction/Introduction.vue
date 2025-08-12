<script setup lang="ts">
import { useActiveEntities, useWorkspace } from '@scalar/api-client/store'
import { RequestAuth } from '@scalar/api-client/views/Request/RequestSection/RequestAuth'
import { ScalarErrorBoundary } from '@scalar/components'
import { getSlugUid } from '@scalar/oas-utils/transforms'
import type { ApiReferenceConfiguration } from '@scalar/types'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { computed } from 'vue'

import { Lazy } from '@/components/Lazy'
import { BaseUrl } from '@/features/base-url'
import { useNavState } from '@/hooks/useNavState'
import type { ClientOptionGroup } from '@/v2/blocks/scalar-request-example-block/types'

import { ClientLibraries } from '../ClientLibraries'
import IntroductionSection from './IntroductionSection.vue'

const { config, store } = defineProps<{
  config?: ApiReferenceConfiguration
  clientOptions: ClientOptionGroup[]
  store: WorkspaceStore
}>()

const { collections, securitySchemes, servers } = useWorkspace()
const {
  activeCollection: _activeCollection,
  activeEnvVariables,
  activeEnvironment,
  activeWorkspace,
} = useActiveEntities()

/** Match the collection by slug if provided */
const activeCollection = computed(() => {
  if (config?.slug) {
    const collection = collections[getSlugUid(config.slug)]
    if (collection) {
      return collection
    }
  }
  return _activeCollection.value
})

/** Ensure the server is the one selected in the collection */
const activeServer = computed(() => {
  if (!activeCollection.value) {
    return undefined
  }

  if (activeCollection.value.selectedServerUid) {
    const server = servers[activeCollection.value.selectedServerUid]
    if (server) {
      return server
    }
  }

  return servers[activeCollection.value.servers[0]]
})

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
        <ScalarErrorBoundary>
          <div
            class="introduction-card"
            :class="{ 'introduction-card-row': config?.layout === 'classic' }">
            <div
              v-if="activeCollection?.servers?.length"
              class="scalar-reference-intro-server scalar-client introduction-card-item text-base leading-normal [--scalar-address-bar-height:0px]">
              <BaseUrl
                :collection="activeCollection"
                :server="activeServer" />
            </div>
            <div
              v-if="
                activeCollection &&
                activeWorkspace &&
                Object.keys(securitySchemes ?? {}).length
              "
              class="scalar-reference-intro-auth scalar-client introduction-card-item leading-normal">
              <RequestAuth
                :collection="activeCollection"
                :envVariables="activeEnvVariables"
                :environment="activeEnvironment"
                layout="reference"
                :persistAuth="config?.persistAuth"
                :selectedSecuritySchemeUids="
                  activeCollection?.selectedSecuritySchemeUids ?? []
                "
                :server="activeServer"
                title="Authentication"
                :workspace="activeWorkspace" />
            </div>
            <ClientLibraries
              v-if="
                config?.hiddenClients !== true &&
                clientOptions.length &&
                store.workspace.activeDocument
              "
              :clientOptions
              :document="store.workspace.activeDocument"
              :selectedClient="store.workspace['x-scalar-default-client']"
              class="introduction-card-item scalar-reference-intro-clients" />
          </div>
        </ScalarErrorBoundary>
      </template>
    </IntroductionSection>
  </Lazy>
</template>

<style scoped>
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
