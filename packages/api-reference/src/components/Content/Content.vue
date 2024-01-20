<script setup lang="ts">
import { useResizeObserver } from '@vueuse/core'
import { computed, ref } from 'vue'

import { hasModels, hasWebhooks } from '../../helpers'
import { useRefOnMount } from '../../hooks'
import type { Spec } from '../../types'
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
</script>
<template>
  <div
    ref="referenceEl"
    :class="{
      'references-narrow': isNarrow,
    }">
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
      v-for="(tag, index) in parsedSpec.tags"
      :key="tag.id">
      <Component
        :is="tagLayout"
        v-if="tag.operations && tag.operations.length > 0"
        :isFirst="index === 0"
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
