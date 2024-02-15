<script setup lang="ts">
import { useResizeObserver } from '@vueuse/core'
import { computed, ref, watch } from 'vue'

import { hasModels, scrollToId } from '../../helpers'
import { useNavState, useRefOnMount } from '../../hooks'
import type { Spec } from '../../types'
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

// Don't lazy load if we are deep linking via hash
const lazyIndexTag = ref<number | null>(null)
const lazyIndexOperation = ref<number | null>(null)

watch(
  () => props.parsedSpec.tags?.length,
  (tagsLength) => {
    lazyIndexOperation.value = 0
    lazyIndexTag.value = 0

    if (!hash.value || !tagsLength || !props.parsedSpec.tags) return

    const sectionId = getSectionId()

    // If models, don't lazy load any tags
    if (sectionId === 'models') {
      lazyIndexTag.value = tagsLength ?? 0
    }

    // Lazy load until specific tag
    if (sectionId.startsWith('tag')) {
      const tagIndex = props.parsedSpec.tags?.findIndex(
        (tag) => getTagId(tag) === sectionId,
      )
      lazyIndexTag.value = tagIndex ?? 0

      // Lazy load until specific operation
      const operationMatches = hash.value.match(/tag\/([^/]+)\/([^/]+)\/(.+)/)
      if (operationMatches?.length === 4) {
        const matchedVerb = operationMatches[2]
        const matchedPath = '/' + operationMatches[3]

        const operationIndex = props.parsedSpec.tags[
          lazyIndexTag.value
        ]?.operations.findIndex(
          ({ httpVerb, path }) =>
            matchedVerb === httpVerb && matchedPath === path,
        )
        lazyIndexOperation.value = operationIndex
      }
    }

    const includeFirst = sectionId === hash.value && sectionId.startsWith('tag')
    // const loadingTags

    // Deep link on load
    if (sectionId === hash.value && sectionId.startsWith('tag')) {
      // includeFirst
    }
    // If tag then load regular
    // - unless not enough operations, then have to go to next tag
    // If operation start at operation
    // - same thing of not enouh operations, roll to next
    // models
    //
    // edge cases
    // last operation/model, no more after
    // - need to show from bottom instead or something
  },
  { immediate: true },
)

const deepLinkLoading = ref(!!window.location.hash)

// Scroll to hash when component has rendered
const unsubscribe = lazyBus.on(({ id }) => {
  const hashStr = window.location.hash.substring(1)

  if (!hashStr || id !== hashStr) return
  unsubscribe()

  // Timeout is to allow codemirror to finish loading and prevent layout shift
  // since we are already showing the docs this is inconsequential
  setTimeout(() => {
    scrollToId(hashStr)
    deepLinkLoading.value = false
  }, 300)
})
</script>
<template>
  <div
    ref="referenceEl"
    :class="{
      'references-narrow': isNarrow,
    }">
    <div
      v-show="deepLinkLoading"
      class="references-deep-link-loading">
      <template
        v-for="tag in parsedSpec.tags"
        :key="tag.id">
        <Component
          :is="tagLayout"
          v-if="tag.operations && tag.operations.length > 0"
          :spec="parsedSpec"
          :tag="tag">
          <Component
            :is="endpointLayout"
            v-for="operation in tag.operations"
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
        typeof lazyIndexTag === 'number' &&
        typeof lazyIndexOperation === 'number'
      ">
      <template
        v-for="(tag, index) in parsedSpec.tags"
        :key="tag.id">
        <Lazy
          :id="getTagId(tag)"
          :isLazy="index > lazyIndexTag">
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
                index !== lazyIndexTag || operationIndex > lazyIndexOperation
              ">
              <Component
                :is="endpointLayout"
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
.references-deep-link-loading {
  position: absolute;
  top: 0;
  top: calc(var(--refs-header-height) - 1px);
  left: 0;
  right: 0;
  z-index: 1;
  grid-area: rendered;
  background: var(--theme-background-1, var(--default-theme-background-1));
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
