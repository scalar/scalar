<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ScalarMarkdown } from '@scalar/components'
import { ScalarIconCaretRight } from '@scalar/icons'
import type { Request as RequestEntity } from '@scalar/oas-utils/entities/spec'
import { isDefined } from '@scalar/oas-utils/helpers'
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
    breadcrumb?: string[]
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
const selectedContentType = ref<string>(contentTypes.value[0])
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
 * We're showing request data, read-only parameters should not be shown.
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
        class="parameter-item-trigger"
        :class="{ 'parameter-item-trigger-open': open }">
        <span class="parameter-item-name">
          <ScalarIconCaretRight
            weight="bold"
            class="parameter-item-icon size-3 transition-transform duration-100"
            :class="{ 'rotate-90': open }" />
          <span>{{ parameter.name }}</span>
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
          :breadcrumb="breadcrumb"
          :headers="parameter.headers" />
        <SchemaProperty
          is="div"
          compact
          :breadcrumb="breadcrumb"
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
          :withExamples="withExamples" />
      </DisclosurePanel>
    </Disclosure>
    <div
      class="absolute top-3 right-0 opacity-0 group-focus-within/parameter-item:opacity-100 group-hover/parameter-item:opacity-100">
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
