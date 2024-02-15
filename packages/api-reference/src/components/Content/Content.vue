<script setup lang="ts">
import { useResizeObserver } from '@vueuse/core'
import { computed, reactive, ref, watch } from 'vue'

import { hasModels, scrollToId } from '../../helpers'
import { useNavState, useRefOnMount } from '../../hooks'
import type { Spec, Tag, TransformedOperation } from '../../types'
import Lazy, { lazyBus } from '../Lazy.vue'
import { Authentication } from './Authentication'
import Introduction from './Introduction'
import ClientList from './Introduction/ClientList.vue'
import ServerList from './Introduction/ServerList.vue'
import Models from './Models.vue'
import ModelsAccordion from './ModelsAccordion.vue'
import ReferenceEndpoint from './ReferenceEndpoint'
import ReferenceEndpointAccordion from './ReferenceEndpoint/ReferenceEndpointAccordion.vue'
import ReferenceTag from './ReferenceTag.vue'
import ReferenceTagAccordion from './ReferenceTagAccordion.vue'
import Webhooks from './Webhooks.vue'

const props = defineProps<{
  parsedSpec: Spec
  rawSpec: string
  layout?: 'default' | 'accordion'
}>()

const referenceEl = ref<HTMLElement | null>(null)
const isNarrow = ref(true)

useResizeObserver(
  referenceEl,
  (entries) => (isNarrow.value = entries[0].contentRect.width < 900),
)

const { getOperationId, getSectionId, getTagId, hash } = useNavState()

const fallBackServer = useRefOnMount(() => {
  return {
    url: window.location.origin,
  }
})

const localServers = computed(() => {
  if (props.parsedSpec.servers && props.parsedSpec.servers.length > 0) {
    return props.parsedSpec.servers
  } else if (
    props.parsedSpec.host &&
    props.parsedSpec.schemes &&
    props.parsedSpec.schemes.length > 0
  ) {
    return [
      {
        url: `${props.parsedSpec.schemes[0]}://${props.parsedSpec.host}${
          props.parsedSpec?.basePath ?? ''
        }`,
      },
    ]
  } else if (fallBackServer.value) {
    return [fallBackServer.value]
  } else {
    return [{ url: '' }]
  }
})

const tagLayout = computed<typeof ReferenceTag>(() =>
  props.layout === 'accordion' ? ReferenceTagAccordion : ReferenceTag,
)
const endpointLayout = computed<typeof ReferenceEndpoint>(() =>
  props.layout === 'accordion' ? ReferenceEndpointAccordion : ReferenceEndpoint,
)
const introCardsSlot = computed(() =>
  props.layout === 'accordion' ? 'after' : 'aside',
)

// Don't lazy load up to index if we are deep linking via hash
const deepLink = reactive({
  hideTag: false,
  isLoading: !!window.location.hash,
  operationIndex: null as number | null,
  tagsIndex: null as number | null,
  tags: [] as (Tag & { lazyOperations: TransformedOperation[] })[],
})

watch(
  () => props.parsedSpec.tags?.length,
  (tagsLength) => {
    deepLink.operationIndex = 0
    deepLink.tagsIndex = 0

    if (!hash.value || typeof tagsLength !== 'number' || !props.parsedSpec.tags)
      return

    const sectionId = getSectionId()

    // Lazy load until specific tag
    if (sectionId.startsWith('tag')) {
      const tagIndex = props.parsedSpec.tags?.findIndex(
        (tag) => getTagId(tag) === sectionId,
      )
      deepLink.tagsIndex = tagIndex ?? 0

      // Lazy load until specific operation
      const operationMatches = hash.value.match(/tag\/([^/]+)\/([^/]+)\/(.+)/)
      if (operationMatches?.length === 4) {
        const matchedVerb = operationMatches[2]
        const matchedPath = '/' + operationMatches[3]

        const operationIndex = props.parsedSpec.tags[
          deepLink.tagsIndex
        ]?.operations.findIndex(
          ({ httpVerb, path }) =>
            matchedVerb === httpVerb && matchedPath === path,
        )
        deepLink.operationIndex = operationIndex
      }

      // Add a few tags to the loading section
      const tag = props.parsedSpec.tags[deepLink.tagsIndex]
      deepLink.hideTag = sectionId !== hash.value && sectionId.startsWith('tag')

      deepLink.tags.push({
        ...tag,
        lazyOperations: tag.operations.slice(
          deepLink.operationIndex,
          deepLink.operationIndex + 2,
        ),
      })
    }
  },
  { immediate: true },
)

// Scroll to hash when component has rendered
const unsubscribe = lazyBus.on(({ id }) => {
  const hashStr = window.location.hash.substring(1)

  if (!hashStr || id !== hashStr) return
  unsubscribe()

  // Timeout is to allow codemirror to finish loading and prevent layout shift
  // since we are already showing the docs this is inconsequential
  setTimeout(() => {
    scrollToId(hashStr)
    deepLink.isLoading = false
  }, 100)
})
</script>
<template>
  <div
    ref="referenceEl"
    :class="{
      'references-narrow': isNarrow,
    }">
    <!-- These are just for the initial load on deep linking -->
    <div
      v-show="deepLink.isLoading"
      class="references-loading"
      :class="{ 'references-loading-hidden-tag': deepLink.hideTag }">
      <template
        v-for="tag in deepLink.tags"
        :key="tag.id">
        <Component
          :is="tagLayout"
          v-if="tag.operations && tag.operations.length > 0"
          :spec="parsedSpec"
          :tag="tag">
          <Component
            :is="endpointLayout"
            v-for="operation in tag.lazyOperations"
            :key="`${operation.httpVerb}-${operation.operationId}`"
            :operation="operation"
            :server="localServers[0]"
            :tag="tag" />
        </Component>
      </template>
    </div>
    <slot name="start" />
    <Introduction
      v-if="parsedSpec.info.title || parsedSpec.info.description"
      :info="parsedSpec.info"
      :parsedSpec="parsedSpec"
      :rawSpec="rawSpec">
      <template #[introCardsSlot]>
        <div
          class="introduction-cards"
          :class="{ 'introduction-cards-row': layout === 'accordion' }">
          <ServerList :value="localServers" />
          <ClientList />
          <Authentication :parsedSpec="parsedSpec" />
        </div>
      </template>
    </Introduction>
    <slot
      v-else
      name="empty-state" />
    <template
      v-if="
        typeof deepLink.operationIndex === 'number' &&
        typeof deepLink.tagsIndex === 'number'
      ">
      <template
        v-for="(tag, index) in parsedSpec.tags"
        :key="tag.id">
        <Lazy
          :id="getTagId(tag)"
          :isLazy="index > deepLink.tagsIndex">
          <Component
            :is="tagLayout"
            v-if="tag.operations && tag.operations.length > 0"
            :id="getTagId(tag)"
            :spec="parsedSpec"
            :tag="tag">
            <Lazy
              v-for="(operation, operationIndex) in tag.operations"
              :id="getOperationId(operation, tag)"
              :key="`${operation.httpVerb}-${operation.operationId}`"
              :isLazy="
                index !== deepLink.tagsIndex ||
                operationIndex > deepLink.operationIndex
              ">
              <Component
                :is="endpointLayout"
                :id="getOperationId(operation, tag)"
                :operation="operation"
                :server="localServers[0]"
                :tag="tag" />
            </Lazy>
          </Component>
        </Lazy>
      </template>
    </template>
    <template v-if="parsedSpec.webhooks">
      <Webhooks :webhooks="parsedSpec.webhooks" />
    </template>
    <template v-if="hasModels(parsedSpec)">
      <ModelsAccordion
        v-if="layout === 'accordion'"
        :components="parsedSpec.components" />
      <Models
        v-else
        :components="parsedSpec.components" />
    </template>
    <slot name="end" />
  </div>
</template>
<style scoped>
.references-loading {
  position: absolute;
  top: 0;
  top: calc(var(--refs-header-height) - 1px);
  left: 0;
  right: 0;
  z-index: 1;
  grid-area: rendered;
  background: var(--theme-background-1, var(--default-theme-background-1));
}
.references-loading-hidden-tag .section-container :deep(.section:first-child) {
  display: none;
}
.introduction-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.introduction-cards-row {
  flex-direction: row;
  gap: 24px;
  --default-theme-background-2: var(--default-theme-background-1);
  --theme-background-2: var(--theme-background-1);
}
.introduction-cards-row > * {
  flex: 1;
}
.references-narrow .introduction-cards-row {
  flex-direction: column;
  align-items: stretch;
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
</style>
