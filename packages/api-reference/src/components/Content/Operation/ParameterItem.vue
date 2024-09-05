<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'
import type { ContentType, Parameters } from '@scalar/types/legacy'
import { computed, ref } from 'vue'

import { SchemaProperty } from '../Schema'
import ContentTypeSelect from './ContentTypeSelect.vue'
import ParameterHeaders from './ParameterHeaders.vue'

const props = withDefaults(
  defineProps<{
    parameter: Parameters
    showChildren?: boolean
    collapsableItems?: boolean
  }>(),
  {
    showChildren: false,
    collapsableItems: false,
  },
)
const showCollapsedItems = ref(false)

const contentTypes = computed(() => {
  if (props.parameter.content) {
    return Object.keys(props.parameter.content)
  }
  return []
})
const selectedContentType = ref<ContentType>(
  contentTypes.value[0] as ContentType,
)
if (props.parameter.content) {
  if ('application/json' in props.parameter.content) {
    selectedContentType.value = 'application/json'
  }
}

const shouldCollapse = computed(() => {
  return props.collapsableItems && props.parameter.content
})
</script>
<template>
  <li class="parameter-item">
    <div
      v-if="shouldCollapse"
      class="flex parameter-item-trigger"
      :class="{ 'parameter-item-trigger-open': showCollapsedItems }"
      @click="showCollapsedItems = !showCollapsedItems">
      <ScalarIcon
        class="parameter-item-icon"
        :icon="showCollapsedItems ? 'ChevronDown' : 'ChevronRight'"
        size="md"
        thickness="1.75" />
      <span class="parameter-item-name">
        {{ parameter.name }}
      </span>
      <span class="parameter-item-type">
        {{ parameter.description }}
      </span>
      <ContentTypeSelect
        v-if="shouldCollapse && props.parameter.content"
        class="parameter-item-content-type"
        :defaultValue="selectedContentType"
        :requestBody="props.parameter"
        @selectContentType="
          ({ contentType }) => (selectedContentType = contentType)
        " />
    </div>
    <div
      v-if="(shouldCollapse && showCollapsedItems) || !shouldCollapse"
      class="parameter-item-container parameter-item-container-markdown">
      <ParameterHeaders
        v-if="parameter.headers"
        :headers="parameter.headers" />
      <SchemaProperty
        compact
        :description="shouldCollapse ? '' : parameter.description"
        :name="shouldCollapse ? '' : parameter.name"
        :noncollapsible="showChildren"
        :required="parameter.required"
        :value="
          parameter.content
            ? parameter.content?.[selectedContentType]?.schema
            : parameter.schema
        " />
    </div>
  </li>
</template>

<style scoped>
.parameter-item {
  border-top: var(--scalar-border-width) solid var(--scalar-border-color);
}
.parameter-item:last-of-type .parameter-schema {
  padding-bottom: 0;
}
.parameter-item-container {
  padding: 0;
}

.parameter-item-headers {
  border: var(--scalar-border-width) solid var(--scalar-border-color);
}

.parameter-item-name {
  font-weight: 500;
  margin-right: 6px;
  font-family: var(--scalar-font-code);
  font-size: var(--scalar-mini);
  color: var(--scalar-color-1);
}

.parameter-item-type {
  font-size: var(--scalar-font-size-3);
  color: var(--scalar-color-2);
  margin-right: 6px;
}
.parameter-item-required-optional {
  color: var(--scalar-color-2);
  font-weight: var(--scalar-semibold);
  margin-right: 6px;
  position: relative;
}

.parameter-item--required {
  text-transform: uppercase;
  font-size: var(--scalar-micro);
  font-weight: var(--scalar-semibold);
  color: var(--scalar-color-orange);
}

.parameter-item-description {
  margin-top: 3px !important;
  font-size: var(--scalar-small);
  color: var(--scalar-color-2);
  line-height: 1.4;
}

.parameter-item-description :deep(p) {
  margin-top: 4px;
  font-size: var(--scalar-small);
  color: var(--scalar-color-2);
  line-height: 1.4;
}

.parameter-schema {
  padding-bottom: 9px;
  margin-top: 3px;
}
.parameter-item-trigger {
  padding: 10px 0;
  cursor: pointer;
  position: relative;
  align-items: baseline;
}
.parameter-item-trigger-open {
  padding-bottom: 0;
}
.parameter-item-trigger:after {
  content: '';
  position: absolute;
  height: 10px;
  width: 100%;
  bottom: 0;
}
.parameter-item-icon {
  color: var(--scalar-color-3);
  position: absolute;
  left: -18px;
}
.parameter-item-trigger:hover .parameter-item-icon {
  color: var(--scalar-color-1);
}
.parameter-item-content-type {
  margin-left: auto;
  opacity: 0;
}
.parameter-item-trigger-open .parameter-item-content-type,
.parameter-item-trigger:hover .parameter-item-content-type {
  opacity: 1;
}
.parameter-item-container-markdown :deep(.property-description:last-of-type) {
  margin-top: 0;
}
</style>
