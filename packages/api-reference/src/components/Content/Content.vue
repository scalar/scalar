<script setup lang="ts">
import { useResizeObserver } from '@vueuse/core'
import { onMounted, ref } from 'vue'

import { useTemplateStore } from '../../stores/template'
import type { Spec } from '../../types'
import { FlowIcon } from '../Icon'
import Introduction from './Introduction'
import ReferenceEndpoint from './ReferenceEndpoint'
import ReferenceTag from './ReferenceTag.vue'
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
        :servers="spec.servers" />
      <template
        v-for="(tag, index) in spec.tags"
        :key="tag.id">
        <div class="reference">
          <ReferenceTag
            :index="index"
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
              :key="operation.operationId"
              :operation="operation"
              :parentTag="tag"
              :server="spec.servers?.[0]" />
          </template>
        </div>
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
    var(--scalar-api-reference-full-height) -
      var(--scalar-api-reference-theme-header-height)
  );
  display: flex;
  align-items: center;
  justify-content: center;
}
.show-more {
  background: var(--scalar-api-reference-theme-background-1);
  appearance: none;
  border: none;
  border: 1px solid var(--scalar-api-reference-theme-border-color);
  margin: auto;
  padding: 8px 12px;
  border-radius: 30px;
  color: var(--scalar-api-reference-theme-color-1);
  font-weight: var(--scalar-api-reference-theme-semibold);
  font-size: var(--scalar-api-reference-theme-font-size-4);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -48px;
  margin-bottom: 48px;
  position: relative;
}
.show-more:hover {
  color: var(--scalar-api-reference-theme-color-2);
  cursor: pointer;
}
.show-more-icon {
  width: 14px;
  height: 14px;
  margin-left: 3px;
}
.show-more:active {
  box-shadow: 0 0 0 1px var(--scalar-api-reference-theme-border-color);
}
@media (max-width: 1165px) {
  .show-more {
    margin-top: -24px;
    margin-bottom: 24px;
  }
}
</style>
