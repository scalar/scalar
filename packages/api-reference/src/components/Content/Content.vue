<script setup lang="ts">
import { BaseUrl } from '@/features/BaseUrl'
import { useActiveEntities, useWorkspace } from '@scalar/api-client/store'
import { RequestAuth } from '@scalar/api-client/views/Request/RequestSection/RequestAuth'
import { ScalarErrorBoundary } from '@scalar/components'
import type { Spec } from '@scalar/types/legacy'
import { computed } from 'vue'

import { getModels, hasModels } from '../../helpers'
import { useSidebar } from '../../hooks'
import { ClientLibraries } from './ClientLibraries'
import { Introduction } from './Introduction'
import { Loading } from './Lazy'
import { Models, ModelsAccordion } from './Models'
import { TagList } from './Tag'
import { Webhooks } from './Webhooks'

const props = withDefaults(
  defineProps<{
    parsedSpec: Spec
    layout?: 'modern' | 'classic'
  }>(),
  {
    layout: 'modern',
  },
)

const { hideModels } = useSidebar()
const { securitySchemes } = useWorkspace()
const {
  activeCollection,
  activeEnvVariables,
  activeEnvironment,
  activeServer,
  activeWorkspace,
} = useActiveEntities()

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
      :layout="layout"
      :parsedSpec="parsedSpec" />

    <Introduction
      v-if="parsedSpec?.info?.title || parsedSpec?.info?.description"
      :info="parsedSpec.info"
      :parsedSpec="parsedSpec">
      <template #[introCardsSlot]>
        <ScalarErrorBoundary>
          <div
            class="introduction-card"
            :class="{ 'introduction-card-row': layout === 'classic' }">
            <div
              v-if="activeCollection?.servers?.length"
              class="scalar-client introduction-card-item [--scalar-address-bar-height:0px] divide-y text-sm">
              <BaseUrl />
            </div>
            <div
              v-if="
                activeCollection &&
                activeWorkspace &&
                Object.keys(securitySchemes ?? {}).length
              "
              class="scalar-client introduction-card-item">
              <RequestAuth
                :collection="activeCollection"
                :envVariables="activeEnvVariables"
                :environment="activeEnvironment"
                layout="reference"
                :selectedSecuritySchemeUids="
                  activeCollection?.selectedSecuritySchemeUids ?? []
                "
                :server="activeServer"
                title="Authentication"
                :workspace="activeWorkspace" />
            </div>
            <ClientLibraries class="introduction-card-item" />
          </div>
        </ScalarErrorBoundary>
      </template>
    </Introduction>
    <slot
      v-else
      name="empty-state" />
    <template v-if="parsedSpec.tags">
      <template v-if="parsedSpec['x-tagGroups']">
        <TagList
          v-for="tagGroup in parsedSpec['x-tagGroups']"
          :key="tagGroup.name"
          :layout="layout"
          :spec="parsedSpec"
          :tags="
            tagGroup.tags
              .map((name) => parsedSpec.tags?.find((t) => t.name === name))
              .filter((tag) => !!tag)
          " />
      </template>
      <TagList
        v-else
        :layout="layout"
        :spec="parsedSpec"
        :tags="parsedSpec.tags" />
    </template>

    <template v-if="parsedSpec.webhooks">
      <Webhooks :webhooks="parsedSpec.webhooks" />
    </template>

    <template v-if="hasModels(parsedSpec) && !hideModels">
      <ModelsAccordion
        v-if="layout === 'classic'"
        :schemas="getModels(parsedSpec)" />
      <Models
        v-else
        :schemas="getModels(parsedSpec)" />
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
  background: var(--scalar-background-1);
}
.introduction-card-item {
  display: flex;
  overflow: hidden;
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-radius: var(--scalar-radius-lg);
  margin-bottom: 12px;
  flex-direction: column;
  justify-content: start;
}
@container narrow-references-container (max-width: 900px) {
  .introduction-card-item {
    border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
  }
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
