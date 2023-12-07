<script setup lang="ts">
import { useResizeObserver } from '@vueuse/core'
import { computed, onMounted, ref } from 'vue'

import { hasModels } from '../../helpers'
import { useSidebar, useRefOnMount } from '../../hooks'
import type { Spec } from '../../types'
import Introduction from './Introduction'
import Models from './Models.vue'
import ReferenceEndpoint from './ReferenceEndpoint'
import ReferenceEndpointAccordion from './ReferenceEndpoint/ReferenceEndpointAccordion.vue'
import ReferenceTag from './ReferenceTag.vue'
import ReferenceTagAccordion from './ReferenceTagAccordion.vue'

const props = defineProps<{
  parsedSpec: Spec
  rawSpec: string
  layout?: 'default' | 'accordion'
}>()

const { setCollapsedSidebarItem } = useSidebar()

const referenceEl = ref<HTMLElement | null>(null)

const isNarrow = ref(true)

useResizeObserver(
  referenceEl,
  (entries) => (isNarrow.value = entries[0].contentRect.width < 900),
)

onMounted(() => {
  if (props.parsedSpec.tags?.length) {
    setCollapsedSidebarItem(props.parsedSpec.tags[0].name, true)
  }
})

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
      { url: `${props.parsedSpec.schemes[0]}://${props.parsedSpec.host}` },
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
      :rawSpec="rawSpec"
      :servers="localServers" />
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
    <template v-if="hasModels(parsedSpec)">
      <Models :components="parsedSpec.components" />
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
</style>
