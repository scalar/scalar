<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'
import type { ContentType, Parameters } from '@scalar/oas-utils'
import { computed, ref } from 'vue'

import { SchemaProperty } from '../Schema'
import ContentTypeSelect from './ContentTypeSelect.vue'

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
      class="flex"
      @click="showCollapsedItems = !showCollapsedItems">
      <ScalarIcon
        :icon="showCollapsedItems ? 'ChevronDown' : 'ChevronRight'"
        size="md"
        thickness="1.75" />
      <span>
        {{ parameter.name }}
      </span>
      <span>
        {{ parameter.description }}
      </span>
    </div>
    <div
      v-if="(shouldCollapse && showCollapsedItems) || !shouldCollapse"
      class="parameter-item-container">
      <ContentTypeSelect
        v-if="shouldCollapse && props.parameter.content"
        :defaultValue="selectedContentType"
        :requestBody="props.parameter"
        @selectContentType="
          ({ contentType }) => (selectedContentType = contentType)
        " />
      <SchemaProperty
        compact
        :description="shouldCollapse ? '' : parameter.description"
        :level="0"
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
  border-top: 1px solid var(--scalar-border-color);
}
.parameter-item:last-of-type .parameter-schema {
  padding-bottom: 0;
}
.parameter-item-container {
  padding: 0;
}

.parameter-item-name {
  font-weight: 500;
  margin-right: 6px;
  font-family: var(--scalar-font-code);
  font-size: var(--scalar-mini);
  color: var(--scalar-color-1);
}

.parameter-item-type,
.parameter-item-required-optional {
  color: var(--scalar-color-3);
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
</style>
