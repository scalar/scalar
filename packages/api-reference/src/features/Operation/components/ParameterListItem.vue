<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ScalarMarkdown } from '@scalar/components'
import { ScalarIconCaretRight } from '@scalar/icons'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { ParameterObject } from '@scalar/workspace-store/schemas/v3.1/strict/parameter'
import type { ResponseObject } from '@scalar/workspace-store/schemas/v3.1/strict/response'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/schema'
import { computed, ref } from 'vue'

import ContentTypeSelect from './ContentTypeSelect.vue'
import Headers from './Headers.vue'

const {
  collapsableItems = false,
  withExamples = true,
  name,
  parameter,
  breadcrumb,
} = defineProps<{
  parameter: ParameterObject | ResponseObject
  name: string
  collapsableItems?: boolean
  withExamples?: boolean
  breadcrumb?: string[]
}>()

/** Responses and params may both have a schema */
const schema = computed<SchemaObject | null>(() =>
  'schema' in parameter && parameter.schema
    ? getResolvedRef(parameter.schema)
    : null,
)

/** Response and params may both have content */
const content = computed(() =>
  'content' in parameter && parameter.content ? parameter.content : null,
)

const selectedContentType = ref<string>(Object.keys(content.value || {})[0])

/** Response headers */
const headers = computed<ResponseObject['headers'] | null>(() =>
  'headers' in parameter && parameter.headers ? parameter.headers : null,
)

/**
 * Determines whether this parameter item should be rendered as a collapsible disclosure.
 * Only collapses when collapsableItems is enabled and the parameter has additional
 * content to display (content types, headers, or schema details).
 */
const shouldCollapse = computed<boolean>(() =>
  Boolean(collapsableItems && (content.value || headers.value || schema.value)),
)
</script>
<template>
  <li class="parameter-item group/parameter-item relative">
    <Disclosure v-slot="{ open }">
      <DisclosureButton
        v-if="shouldCollapse"
        class="parameter-item-trigger"
        :class="{ 'parameter-item-trigger-open': open }">
        <span class="parameter-item-name">
          <ScalarIconCaretRight
            class="parameter-item-icon size-3 transition-transform duration-100"
            :class="{ 'rotate-90': open }"
            weight="bold" />
          <span>{{ name }}</span>
        </span>
        <span class="parameter-item-type">
          <ScalarMarkdown
            v-if="parameter.description"
            class="markdown"
            :value="parameter.description" />
        </span>
      </DisclosureButton>
      <DisclosurePanel
        class="parameter-item-container parameter-item-container-markdown"
        :static="!shouldCollapse">
        <!-- Headers -->
        <Headers
          v-if="headers"
          :breadcrumb="breadcrumb"
          :headers="headers" />

        <!-- Schema -->
        <!-- <SchemaProperty
          is="div"
          :breadcrumb="breadcrumb"
          compact
          :description="shouldCollapse ? '' : parameter.description"
          :name="shouldCollapse ? '' : parameter.name"
          :noncollapsible="true"
          :required="parameter.required"
          :value="{
            ...(parameter.content
              ? parameter.content?.[selectedContentType]?.schema
              : parameter.schema),
            deprecated: parameter.deprecated,
            ...(isDefined(parameter.example) && { example: parameter.example }),
            examples: parameter.content
              ? {
                  ...parameter.examples,
                  ...parameter.content?.[selectedContentType]?.examples,
                }
              : parameter.examples || parameter.schema?.examples,
          }"
          :withExamples="withExamples" /> -->
      </DisclosurePanel>
    </Disclosure>

    <!-- Content type select -->
    <div
      class="absolute top-3 right-0 opacity-0 group-focus-within/parameter-item:opacity-100 group-hover/parameter-item:opacity-100">
      <ContentTypeSelect
        v-if="shouldCollapse && content"
        v-model="selectedContentType"
        class="parameter-item-content-type"
        :content="content" />
    </div>
  </li>
</template>

<style scoped>
.parameter-item {
  display: flex;
  flex-direction: column;
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
  margin-right: 6px;
  font-weight: var(--scalar-semibold);
  font-size: var(--scalar-font-size-3);
  font-family: var(--scalar-font-code);
  color: var(--scalar-color-1);

  position: relative;
}

.parameter-item-type {
  font-size: var(--scalar-mini);
  color: var(--scalar-color-2);
  margin-right: 6px;
  line-height: 1.4;
  white-space: nowrap;
  text-overflow: ellipsis;
  width: 100%;
  overflow: hidden;
}

.parameter-item-trigger-open .parameter-item-type {
  white-space: normal;
}

/* Match font size of markdown for property-detail-value since first child within accordian is displayed as if it were in the markdown section */
.parameter-item-trigger
  + .parameter-item-container
  :deep(.property--level-0 > .property-heading .property-detail-value) {
  font-size: var(--scalar-micro);
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
  display: flex;
  align-items: baseline;
  padding: 12px 0;
  cursor: pointer;
  outline: none;
  text-align: left;
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
  left: -19px;
  top: 50%;
  translate: 0 -50%;
  position: absolute;
}

.parameter-item-trigger:hover .parameter-item-icon,
.parameter-item-trigger:focus-visible .parameter-item-icon {
  color: var(--scalar-color-1);
}

.parameter-item-trigger:focus-visible .parameter-item-icon {
  outline: 1px solid var(--scalar-color-accent);
  outline-offset: 2px;
  border-radius: var(--scalar-radius);
}
</style>
