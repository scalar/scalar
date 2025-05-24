<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ScalarIcon, ScalarMarkdown } from '@scalar/components'
import type { Request as RequestEntity } from '@scalar/oas-utils/entities/spec'
import { isDefined } from '@scalar/oas-utils/helpers'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ContentType } from '@scalar/types/legacy'
import { computed, ref } from 'vue'

import { SchemaProperty } from '@/components/Content/Schema'

import ContentTypeSelect from './ContentTypeSelect.vue'
import ParameterHeaders from './ParameterHeaders.vue'

const props = withDefaults(
  defineProps<{
    parameter:
      | NonNullable<RequestEntity['parameters']>[number]
      | NonNullable<RequestEntity['responses']>[number]
    showChildren?: boolean
    collapsableItems?: boolean
    withExamples?: boolean
    schemas?: Record<string, OpenAPIV3_1.SchemaObject> | unknown
  }>(),
  {
    showChildren: false,
    collapsableItems: false,
    withExamples: true,
  },
)

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

const shouldCollapse = computed<boolean>(() => {
  return !!(
    props.collapsableItems &&
    (props.parameter.content ||
      props.parameter.headers ||
      props.parameter.schema)
  )
})

/**
 * We’re showing request data, read-only parameters should not be shown.
 */
const shouldShowParameter = computed(() => {
  if (props.parameter.readOnly === true) {
    return false
  }

  return true
})
</script>
<template>
  <li
    v-if="shouldShowParameter"
    class="parameter-item group/parameter-item relative">
    <Disclosure v-slot="{ open }">
      <DisclosureButton
        v-if="shouldCollapse"
        class="parameter-item-trigger flex"
        :class="{ 'parameter-item-trigger-open': open }">
        <ScalarIcon
          class="parameter-item-icon"
          :icon="open ? 'ChevronDown' : 'ChevronRight'"
          thickness="1.5" />
        <span class="parameter-item-name">
          {{ parameter.name }}
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
        <ParameterHeaders
          v-if="parameter.headers"
          :headers="parameter.headers" />
        <SchemaProperty
          is="div"
          compact
          :description="shouldCollapse ? '' : parameter.description"
          :name="shouldCollapse ? '' : parameter.name"
          :noncollapsible="true"
          :required="parameter.required"
          :schemas="schemas"
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
          :withExamples="withExamples" />
      </DisclosurePanel>
    </Disclosure>
    <div
      class="absolute right-0 top-2.5 opacity-0 group-focus-within/parameter-item:opacity-100 group-hover/parameter-item:opacity-100">
      <ContentTypeSelect
        v-if="shouldCollapse && props.parameter.content"
        class="parameter-item-content-type"
        :defaultValue="selectedContentType"
        :requestBody="props.parameter"
        @selectContentType="
          ({ contentType }) => (selectedContentType = contentType)
        " />
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
}
.parameter-item-type {
  font-size: var(--scalar-micro);
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
  padding: 12px 0;
  cursor: pointer;
  outline: none;
  text-align: left;
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
  height: 18px;
  left: -19px;
  position: absolute;
  top: 11px;
  width: 18px;
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
