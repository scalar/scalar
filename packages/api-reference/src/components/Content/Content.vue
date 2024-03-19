<script setup lang="ts">
import { computed } from 'vue'

import { hasModels } from '../../helpers'
import { useNavState, useRefOnMount } from '../../hooks'
import type { Spec } from '../../types'
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
}>()

const { getOperationId, getTagId } = useNavState()

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
// const isLazy =
//   props.layout !== 'accordion' &&
//   typeof window !== 'undefined' &&
//   !window.location.hash.startsWith('#model')
</script>
<template>
  <div class="narrow-references-container">
    <slot name="start" />

    <Loading
      :layout="layout"
      :parsedSpec="parsedSpec"
      :server="localServers[0]" />

    <Introduction
      v-if="parsedSpec.info.title || parsedSpec.info.description"
      :info="parsedSpec.info"
      :parsedSpec="parsedSpec">
      <template #[introCardsSlot]>
        <div
          class="introduction-cards"
          :class="{ 'introduction-cards-row': layout === 'accordion' }">
          <BaseUrl :value="localServers" />
          <ClientLibraries />
          <Authentication :parsedSpec="parsedSpec" />
        </div>
      </template>
    </Introduction>
    <slot
      v-else
      name="empty-state" />

    <Lazy
      v-for="(tag, tagIndex) in parsedSpec.tags"
      :id="getTagId(tag)"
      :key="getTagId(tag)"
      :isLazy="tagIndex > 0">
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
          :isLazy="operationIndex > 0">
          <Component
            :is="endpointLayout"
            :id="getOperationId(operation, tag)"
            :operation="operation"
            :server="localServers[0]"
            :tag="tag" />
        </Lazy>
      </Component>
    </Lazy>

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
  background: var(--theme-background-1, var(--default-theme-background-1));
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
