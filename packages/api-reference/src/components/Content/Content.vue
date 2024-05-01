<script setup lang="ts">
import { computed, watch } from 'vue'

import { getModels, hasModels } from '../../helpers'
import { useNavState, useSidebar } from '../../hooks'
import { useServerStore } from '../../stores'
import type { Server, Spec } from '../../types'
import { Authentication } from './Authentication'
import { BaseUrl } from './BaseUrl'
import { ClientLibraries } from './ClientLibraries'
import { Introduction } from './Introduction'
import { Lazy, Loading } from './Lazy'
import { Models, ModelsAccordion } from './Models'
import { Operation, OperationAccordion } from './Operation'
import { Tag, TagAccordion } from './Tag'
import { Webhooks } from './Webhooks'

const props = defineProps<{
  parsedSpec: Spec
  layout?: 'default' | 'accordion'
  baseServerURL?: string
}>()

const { getOperationId, getTagId, hash } = useNavState()
const { setServer } = useServerStore()
const { hideModels, collapsedSidebarItems } = useSidebar()

const prependRelativePath = (server: Server) => {
  // URLs that don't start with http[s]://
  if (server.url.match(/^(?!(https?|file):\/\/).+/)) {
    let baseURL = props.baseServerURL ?? window.location.origin

    // Handle slashes
    baseURL = baseURL.replace(/\/$/, '')
    const url = server.url.startsWith('/') ? server.url : `/${server.url}`
    server.url = `${baseURL}${url}`.replace(/\/$/, '')
  }
  return server
}

// Watch the spec and set the servers
watch(
  () => props.parsedSpec,
  (parsedSpec) => {
    let servers = [
      { url: typeof window !== 'undefined' ? window.location.origin : '/' },
    ]

    if (parsedSpec.servers && parsedSpec.servers.length > 0) {
      servers = parsedSpec.servers
    } else if (props.parsedSpec.host) {
      // Use the first scheme if available, otherwise default to http
      const scheme = props.parsedSpec.schemes?.[0] ?? 'http'

      servers = [
        {
          url: `${scheme}://${props.parsedSpec.host}${
            props.parsedSpec?.basePath ?? ''
          }`,
        },
      ]
    }

    // Pre-pend relative paths (if we can)
    if (props.baseServerURL || typeof window !== 'undefined') {
      servers = servers.map(prependRelativePath)
    }

    setServer({ servers })
  },
  { deep: true, immediate: true },
)
const tagLayout = computed<typeof Tag>(() =>
  props.layout === 'accordion' ? TagAccordion : Tag,
)
const endpointLayout = computed<typeof Operation>(() =>
  props.layout === 'accordion' ? OperationAccordion : Operation,
)
const introCardsSlot = computed(() =>
  props.layout === 'accordion' ? 'after' : 'aside',
)

// If the first load is models, we do not lazy load tags/operations
const isLazy = props.layout !== 'accordion' && !hash.value.startsWith('model')
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
      v-if="parsedSpec.info.title || parsedSpec.info.description"
      :info="parsedSpec.info"
      :parsedSpec="parsedSpec">
      <template #[introCardsSlot]>
        <div
          class="introduction-cards"
          :class="{ 'introduction-cards-row': layout === 'accordion' }">
          <BaseUrl />
          <ClientLibraries />
          <Authentication :parsedSpec="parsedSpec" />
        </div>
      </template>
    </Introduction>
    <slot
      v-else
      name="empty-state" />

    <Lazy
      v-for="tag in parsedSpec.tags"
      :id="getTagId(tag)"
      :key="getTagId(tag)"
      :isLazy="isLazy && !collapsedSidebarItems[getTagId(tag)]">
      <Component
        :is="tagLayout"
        :id="getTagId(tag)"
        :spec="parsedSpec"
        :tag="tag">
        <Lazy
          v-for="(operation, operationIndex) in tag.operations"
          :id="getOperationId(operation, tag)"
          :key="`${operation.httpVerb}-${operation.operationId}`"
          :isLazy="operationIndex > 0">
          <Component
            :is="endpointLayout"
            :id="getOperationId(operation, tag)"
            :operation="operation"
            :tag="tag" />
        </Lazy>
      </Component>
    </Lazy>

    <template v-if="parsedSpec.webhooks">
      <Webhooks :webhooks="parsedSpec.webhooks" />
    </template>

    <template v-if="hasModels(parsedSpec) && !hideModels">
      <ModelsAccordion
        v-if="layout === 'accordion'"
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
.introduction-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.introduction-cards-row {
  flex-flow: row wrap;
  gap: 24px;
}
.introduction-cards-row > * {
  flex: 1;
}
@media (min-width: 600px) {
  .introduction-cards-row > * {
    min-width: min-content;
  }
}
@media (max-width: 600px) {
  .introduction-cards-row > * {
    max-width: 100%;
  }
}
@container (max-width: 900px) {
  .introduction-cards-row {
    flex-direction: column;
    align-items: stretch;
  }
}
.references-classic .introduction-cards-row :deep(.card-footer),
.references-classic .introduction-cards-row :deep(.scalar-card),
.references-classic .introduction-cards-row :deep(.scalar-card--muted) {
  background: var(--scalar-background-1);
}
.references-classic
  .introduction-cards-row
  :deep(.scalar-card:nth-of-type(2) .scalar-card-header) {
  display: none;
}
.references-classic
  .introduction-cards-row
  :deep(.scalar-card:nth-of-type(2) .scalar-card-header) {
  display: none;
}
.references-classic
  .introduction-cards-row
  :deep(
    .scalar-card:nth-of-type(2)
      .scalar-card-header.scalar-card--borderless
      + .scalar-card-content
  ) {
  margin-top: 0;
}
.section-flare {
  position: absolute;
  top: 0;
  right: 0;
  pointer-events: none;
}
</style>
