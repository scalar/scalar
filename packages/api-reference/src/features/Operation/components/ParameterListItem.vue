<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import {
  ScalarMarkdown,
  ScalarMarkdownSummary,
  ScalarWrappingText,
} from '@scalar/components'
import { isDefined } from '@scalar/helpers/array/is-defined'
import { ScalarIconCaretRight } from '@scalar/icons'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  ParameterObject,
  ResponseObject,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, ref } from 'vue'

import SchemaProperty from '@/components/Content/Schema/SchemaProperty.vue'
import type { OperationProps } from '@/features/Operation/Operation.vue'

import ContentTypeSelect from './ContentTypeSelect.vue'
import Headers from './Headers.vue'

const { name, parameter, options, collapsableItems } = defineProps<{
  parameter: ParameterObject | ResponseObject
  name: string
  breadcrumb?: string[]
  eventBus: WorkspaceEventBus | null
  collapsableItems?: boolean
  options: Pick<
    OperationProps['options'],
    'orderRequiredPropertiesFirst' | 'orderSchemaPropertiesBy'
  >
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

const selectedContentType = ref<string>(
  Object.keys(content.value || {})[0] ?? '',
)

/** Response headers */
const headers = computed<ResponseObject['headers'] | null>(() =>
  'headers' in parameter && parameter.headers ? parameter.headers : null,
)

/** Computed value from the combined schema param and content param */
const value = computed(() => {
  const baseSchema = content.value
    ? content.value?.[selectedContentType.value]?.schema
    : schema.value

  const deprecated =
    'deprecated' in parameter ? parameter.deprecated : schema.value?.deprecated

  // Convert examples to schema examples which is an array
  const paramExamples = 'examples' in parameter ? parameter.examples : {}
  const arrayExamples = schema.value?.examples ?? []
  const recordExamples = Object.values({
    ...paramExamples,
    ...content.value?.[selectedContentType.value]?.examples,
  })

  /** Combine param examples with content ones */
  const examples = [...recordExamples, ...arrayExamples]

  return {
    ...getResolvedRef(baseSchema),
    deprecated: deprecated,
    ...('example' in parameter &&
      isDefined(parameter.example) && { example: parameter.example }),
    examples,
  } as SchemaObject
})

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
  <li class="parameter-item group/parameter-item">
    <Disclosure v-slot="{ open }">
      <DisclosureButton
        v-if="shouldCollapse"
        class="parameter-item-trigger"
        :class="{ 'parameter-item-trigger-open': open }">
        <div class="parameter-item-name min-w-0">
          <ScalarIconCaretRight
            class="parameter-item-icon size-3 transition-transform duration-100"
            :class="{ 'rotate-90': open }"
            weight="bold" />
          <div>
            <ScalarWrappingText
              preset="property"
              :text="name" />
          </div>
        </div>
        <ScalarMarkdownSummary
          v-if="!open && parameter.description"
          class="parameter-item-description-summary min-w-0 flex-1"
          controlled
          :value="parameter.description" />
        <div
          v-else
          class="flex-1" />

        <div
          class="absolute top-[calc(9px+0.5lh)] right-0 z-0 flex -translate-y-1/2 items-center"
          :class="{
            'opacity-0 group-focus-within/parameter-item:opacity-100 group-hover/parameter-item:opacity-100':
              !open,
          }">
          <div
            class="from-b-1 absolute inset-y-0 -left-6 -z-1 w-8 bg-linear-to-l from-40% to-transparent" />
          <ContentTypeSelect
            v-if="shouldCollapse && content"
            v-model="selectedContentType"
            :content="content" />
        </div>
      </DisclosureButton>
      <DisclosurePanel
        class="parameter-item-container parameter-item-container-markdown"
        :static="!shouldCollapse">
        <ScalarMarkdown
          v-if="shouldCollapse && parameter.description"
          class="parameter-item-description"
          :value="parameter.description" />
        <!-- Headers -->
        <Headers
          v-if="headers"
          :breadcrumb="breadcrumb"
          :eventBus="eventBus"
          :headers="headers"
          :orderRequiredPropertiesFirst="options.orderRequiredPropertiesFirst"
          :orderSchemaPropertiesBy="options.orderSchemaPropertiesBy" />

        <!-- Schema -->
        <SchemaProperty
          is="div"
          :breadcrumb="breadcrumb"
          compact
          :description="shouldCollapse ? '' : parameter.description"
          :eventBus="eventBus"
          :hideWriteOnly="true"
          :name="shouldCollapse ? '' : name"
          :noncollapsible="true"
          :options="{
            hideWriteOnly: true,
            orderRequiredPropertiesFirst: options.orderRequiredPropertiesFirst,
            orderSchemaPropertiesBy: options.orderSchemaPropertiesBy,
          }"
          :required="'required' in parameter && parameter.required"
          :schema="value" />
      </DisclosurePanel>
    </Disclosure>
  </li>
</template>

<style scoped>
.parameter-item {
  display: flex;
  flex-direction: column;
  position: relative;
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
  position: relative;
  font-weight: var(--scalar-bold);
  font-size: var(--scalar-font-size-4);
  font-family: var(--scalar-font-code);
  color: var(--scalar-color-1);
  overflow-wrap: break-word;
}

.parameter-item-description,
.parameter-item-description-summary {
  font-size: var(--scalar-mini);
  color: var(--scalar-color-2);
}

.parameter-item-description-summary.parameter-item-description-summary > * {
  --markdown-line-height: 1;
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
  margin-top: 6px;
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
  line-height: var(--scalar-line-height-5);
  gap: 6px;
  flex-wrap: wrap;
  padding: 10px 0;
  outline: none;
}

.parameter-item-trigger-open {
  padding-bottom: 0;
}

.parameter-item-icon {
  color: var(--scalar-color-3);
  left: -19px;
  top: 0.5lh;
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
