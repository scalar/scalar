<script setup lang="ts">
import { useResizeObserver } from '@vueuse/core'
import { ref } from 'vue'

import FlowIcon from '@lib/components/FlowIcon.vue'
import { useRefOnMount } from '@lib/hooks/useRefOnMount'

import { useTemplateStore } from '../../stores/template'
import { ApiReferenceClasses } from '../../styles'
import type { Spec } from '../../types'
import Introduction from './Introduction'
import ReferenceEndpoint from './ReferenceEndpoint'
import ReferenceTag from './ReferenceTag.vue'

defineProps<{ ready: boolean; spec: Spec }>()

const referenceEl = ref<HTMLElement | null>(null)

const isNarrow = ref(true)

useResizeObserver(
  referenceEl,
  (entries) => (isNarrow.value = entries[0].contentRect.width < 900),
)

// used as a fallback incase the server is not defined in the spec
const windowServer = useRefOnMount(() => window.location.origin)

const { state: templateState, setCollapsedSidebarItem } = useTemplateStore()
</script>
<template>
  <div
    v-if="ready"
    ref="referenceEl"
    :class="{
      [ApiReferenceClasses.Endpoints]: true,
      [ApiReferenceClasses.Tags]: true,
      'references-narrow': isNarrow,
    }">
    <Introduction
      :info="spec.info"
      :server="spec.servers?.[0] ?? { url: windowServer }" />
    <template
      v-for="(tag, index) in spec.tags"
      :key="tag.id">
      <div class="reference">
        <ReferenceTag
          :index="index"
          :tag="tag" />
        <button
          v-if="index !== 0 && !templateState.collapsedSidebarItems[tag.name]"
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
            :key="operation.operationId"
            :operation="operation"
            :parentTag="tag"
            :server="spec.servers?.[0] ?? { url: windowServer }" />
        </template>
      </div>
    </template>
  </div>
</template>
<style scoped>
.show-more {
  background: var(--theme-background-1);
  appearance: none;
  border: none;
  box-shadow: var(--theme-shadow-1);
  margin: auto;
  padding: 8px 12px;
  border-radius: 30px;
  color: var(--theme-color-1);
  font-weight: var(--theme-semibold);
  font-size: var(--theme-font-size-4);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -48px;
  margin-bottom: 48px;
  position: relative;
}
.show-more:hover {
  color: var(--theme-color-2);
  cursor: pointer;
}
.show-more-icon {
  width: 14px;
  height: 14px;
  margin-left: 3px;
}
.show-more:active {
  box-shadow: 0 0 0 1px var(--theme-border-color);
}
@media (max-width: 1165px) {
  .show-more {
    margin-top: -24px;
    margin-bottom: 24px;
  }
}
</style>
