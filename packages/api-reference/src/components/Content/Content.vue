<script setup lang="ts">
import { useActiveEntities, useWorkspace } from '@scalar/api-client/store'
import { RequestAuth } from '@scalar/api-client/views/Request/RequestSection/RequestAuth'
import { ScalarErrorBoundary } from '@scalar/components'
import { getSlugUid } from '@scalar/oas-utils/transforms'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Spec } from '@scalar/types/legacy'
import { computed } from 'vue'

import { BaseUrl } from '@/features/base-url'
import { useConfig } from '@/hooks/useConfig'

import { ClientLibraries } from './ClientLibraries'
import { Introduction } from './Introduction'
import { Loading } from './Lazy'
import { Models, ModelsAccordion } from './Models'
import { TagList } from './Tag'

const props = withDefaults(
  defineProps<{
    document: OpenAPIV3_1.Document
    parsedSpec: Spec
    layout?: 'modern' | 'classic'
  }>(),
  {
    layout: 'modern',
  },
)

const config = useConfig()
const { collections, securitySchemes, servers } = useWorkspace()
const {
  activeCollection: _activeCollection,
  activeEnvVariables,
  activeEnvironment,
  activeWorkspace,
} = useActiveEntities()

/** Match the collection by slug if provided */
const activeCollection = computed(() => {
  if (config.value.slug) {
    const collection = collections[getSlugUid(config.value.slug)]
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
  props.layout === 'classic' ? 'after' : 'aside',
)
</script>
<template>
  <!-- For adding gradients + animations to introduction of documents that :before / :after won't work for -->
  <div class="section-flare">
    <div class="section-flare-item"></div>
    <div class="section-flare-item"></div>
    <div class="section-flare-item"></div>
    <div class="section-flare-item"></div>
    <div class="section-flare-item"></div>
    <div class="section-flare-item"></div>
    <div class="section-flare-item"></div>
    <div class="section-flare-item"></div>
  </div>
  <div class="narrow-references-container">
    <slot name="start" />
    <Loading
      v-if="activeCollection"
      :document="document"
      :collection="activeCollection"
      :layout="layout"
      :parsedSpec="parsedSpec"
      :server="activeServer" />

    <Introduction
      v-if="document?.info?.title || document?.info?.description"
      :document="document">
      <template #[introCardsSlot]>
        <ScalarErrorBoundary>
          <div
            class="introduction-card"
            :class="{ 'introduction-card-row': layout === 'classic' }">
            <div
              v-if="activeCollection?.servers?.length"
              class="scalar-reference-intro-server scalar-client introduction-card-item text-sm leading-normal [--scalar-address-bar-height:0px]">
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
                :persistAuth="config.persistAuth"
                :selectedSecuritySchemeUids="
                  activeCollection?.selectedSecuritySchemeUids ?? []
                "
                :server="activeServer"
                title="Authentication"
                :workspace="activeWorkspace" />
            </div>
            <ClientLibraries
              class="introduction-card-item scalar-reference-intro-clients" />
          </div>
        </ScalarErrorBoundary>
      </template>
    </Introduction>
    <slot
      v-else
      name="empty-state" />
    <template v-if="parsedSpec.tags && activeCollection">
      <template v-if="parsedSpec['x-tagGroups']">
        <TagList
          v-for="tagGroup in parsedSpec['x-tagGroups']"
          :document="document"
          :key="tagGroup.name"
          :collection="activeCollection"
          :layout="layout"
          :server="activeServer"
          :spec="parsedSpec"
          :tags="
            tagGroup.tags
              .map((name) => parsedSpec.tags?.find((t) => t.name === name))
              .filter((tag) => !!tag)
          " />
      </template>
      <TagList
        v-else
        :collection="activeCollection"
        :document="document"
        :layout="layout"
        :server="activeServer"
        :spec="parsedSpec"
        :tags="parsedSpec.tags" />
    </template>

    <!-- Webhooks -->
    <template v-if="parsedSpec.webhooks?.length && activeCollection">
      <TagList
        :document="document"
        id="webhooks"
        :collection="activeCollection"
        :layout="layout"
        :server="activeServer"
        :spec="parsedSpec"
        :tags="[
          {
            name: 'Webhooks',
            description: '',
            operations: parsedSpec.webhooks,
          },
        ]">
      </TagList>
    </template>

    <template v-if="document?.components?.schemas && !config.hideModels">
      <ModelsAccordion
        v-if="layout === 'classic'"
        :schemas="document?.components?.schemas" />
      <Models
        v-else
        :schemas="document?.components?.schemas" />
    </template>
    <slot name="end" />
  </div>
</template>

<style>
.narrow-references-container {
  container-name: narrow-references-container;
  container-type: inline-size;
}
</style>

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
.section-flare {
  top: 0;
  right: 0;
  pointer-events: none;
}
</style>
