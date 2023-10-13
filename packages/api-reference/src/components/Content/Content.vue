<script setup lang="ts">
import { useResizeObserver } from '@vueuse/core'
import { computed, onMounted, ref } from 'vue'

import { hasModels } from '../../helpers'
import { useRefOnMount } from '../../hooks/useRefOnMount'
import { useTemplateStore } from '../../stores/template'
import type { Spec, Tag } from '../../types'
import { FlowIcon } from '../Icon'
import {
  Section,
  SectionColumn,
  SectionContainer,
  SectionContent,
  SectionHeader,
} from '../Section'
import EndpointsOverview from './EndpointsOverview.vue'
import Introduction from './Introduction'
import Models from './Models.vue'
import ReferenceEndpoint from './ReferenceEndpoint'
import Spinner from './Spinner.vue'

const props = defineProps<{ ready: boolean; spec: Spec }>()

const referenceEl = ref<HTMLElement | null>(null)

const isNarrow = ref(true)

useResizeObserver(
  referenceEl,
  (entries) => (isNarrow.value = entries[0].contentRect.width < 900),
)

const { state: templateState, setCollapsedSidebarItem } = useTemplateStore()

onMounted(() => {
  if (props.spec.tags.length > 0) {
    setCollapsedSidebarItem(props.spec.tags[0].name, true)
  }
})

const fallBackServer = useRefOnMount(() => {
  return {
    url: window.location.origin,
  }
})

const localServers = computed(() => {
  if (props.spec.servers && props.spec.servers.length > 0) {
    return props.spec.servers
  } else if (fallBackServer.value) {
    return [fallBackServer.value]
  } else {
    return [{ url: '' }]
  }
})

const moreThanOneDefaultTag = (tag: Tag) =>
  props.spec?.tags?.length !== 1 ||
  tag?.name !== 'default' ||
  tag?.description !== ''
</script>
<template>
  <div
    ref="referenceEl"
    :class="{
      'references-narrow': isNarrow,
    }">
    <template v-if="ready">
      <Introduction
        :info="spec.info"
        :servers="localServers" />
      <template
        v-for="(tag, index) in spec.tags"
        :key="tag.id">
        <SectionContainer v-if="tag.operations && tag.operations.length > 0">
          <EndpointsOverview
            v-if="moreThanOneDefaultTag(tag)"
            :tag="tag" />
          <button
            v-if="
              index !== 0 &&
              !templateState.collapsedSidebarItems[tag.name] &&
              tag.operations?.length > 1
            "
            class="show-more"
            type="button"
            @click="setCollapsedSidebarItem(tag.name, true)">
            Show More
            <FlowIcon
              class="show-more-icon"
              icon="ChevronDown" />
          </button>
          <template
            v-if="index === 0 || templateState.collapsedSidebarItems[tag.name]">
            <ReferenceEndpoint
              v-for="operation in tag.operations"
              :key="`${operation.httpVerb}-${operation.operationId}`"
              :operation="operation"
              :server="localServers[0]" />
          </template>
        </SectionContainer>
      </template>
      <template v-if="hasModels(spec)">
        <Models :components="spec.components" />
      </template>
    </template>
    <div
      v-else
      class="render-loading">
      <Spinner />
    </div>
  </div>
</template>
<style scoped>
.render-loading {
  height: calc(
    var(
        --scalar-api-reference-full-height,
        var(--default-scalar-api-reference-full-height)
      ) -
      var(
        --scalar-api-reference-theme-header-height,
        var(--default-scalar-api-reference-theme-header-height)
      )
  );
  display: flex;
  align-items: center;
  justify-content: center;
}
.show-more {
  background: var(--theme-background-1, var(--default-theme-background-1));
  appearance: none;
  border: none;
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  margin: auto;
  padding: 8px 12px;
  border-radius: 30px;
  color: var(--theme-color-1, var(--default-theme-color-1));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  font-size: var(--theme-small, var(--default-theme-small));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -48px;
  margin-bottom: 48px;
  position: relative;
}
.show-more:hover {
  color: var(--theme-color-2, var(--default-theme-color-2));
  cursor: pointer;
}
.show-more-icon {
  width: 14px;
  height: 14px;
  margin-left: 3px;
}
.show-more:active {
  box-shadow: 0 0 0 1px
    var(--theme-border-color, var(--default-theme-border-color));
}
.references-narrow .show-more {
  margin-top: -25px;
  margin-bottom: 25px;
}
@media (max-width: 1165px) {
  .show-more {
    margin-top: -24px;
    margin-bottom: 24px;
  }
}
</style>
