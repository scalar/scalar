<script lang="ts" setup>
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ScalarIcon, ScalarMarkdown } from '@scalar/components'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { computed, type Component } from 'vue'

import {
  discriminators,
  optimizeValueForDisplay,
} from '@/components/Content/Schema/helpers/optimizeValueForDisplay'
import { SpecificationExtension } from '@/components/SpecificationExtension'

import Schema from './Schema.vue'
import SchemaDiscriminator from './SchemaDiscriminator.vue'
import SchemaPropertyHeading from './SchemaPropertyHeading.vue'

/**
 * Note: We’re taking in a prop called `value` which should be a JSON Schema.
 *
 * We’re using `optimizeValueForDisplay` to merge null types in discriminators (anyOf, allOf, oneOf, not).
 * So you should basically use the optimizedValue everywhere in the component.
 */

const props = withDefaults(
  defineProps<{
    is?: string | Component
    value?: Record<string, any>
    noncollapsible?: boolean
    level?: number
    name?: string
    required?: boolean
    compact?: boolean
    description?: string
    additional?: boolean
    pattern?: boolean
    withExamples?: boolean
    schemas?: Record<string, OpenAPIV3_1.SchemaObject> | unknown
    hideHeading?: boolean
  }>(),
  {
    level: 0,
    required: false,
    compact: false,
    withExamples: true,
  },
)

const descriptions: Record<string, Record<string, string>> = {
  integer: {
    _default: 'Integer numbers.',
    int32: 'Signed 32-bit integers (commonly used integer type).',
    int64: 'Signed 64-bit integers (long type).',
  },
  string: {
    'date':
      'full-date notation as defined by RFC 3339, section 5.6, for example, 2017-07-21',
    'date-time':
      'the date-time notation as defined by RFC 3339, section 5.6, for example, 2017-07-21T17:32:28Z',
    'password': 'a hint to UIs to mask the input',
    'byte': 'base64-encoded characters, for example, U3dhZ2dlciByb2Nrcw==',
    'binary': 'binary data, used to describe files',
  },
}

const displayDescription = (
  description: string | undefined,
  value?: Record<string, any>,
) => {
  if (value?.properties) {
    return null
  }

  if (value?.additionalProperties) {
    return null
  }

  if (value?.patternProperties) {
    return null
  }

  if (value?.allOf) {
    return null
  }

  return description || value?.description || null
}

const generatePropertyDescription = (property?: Record<string, any>) => {
  if (!property) {
    return null
  }

  if (!descriptions[property.type]) {
    return null
  }

  return descriptions[property.type][property.format || '_default']
}

const getEnumFromValue = (value?: Record<string, any>): any[] | [] =>
  value?.enum || value?.items?.enum || []

// These helpers manage how enum values are displayed:
//
// - For enums with 9 or fewer values, all values are shown.
// - For enums with more than 9 values, only first 5 are shown initially.
// - A “Show more” button reveals the remaining values.
const hasLongEnumList = computed(
  () => getEnumFromValue(optimizedValue.value).length > 9,
)
const initialEnumCount = computed(() => (hasLongEnumList.value ? 5 : 9))
const visibleEnumValues = computed(() =>
  getEnumFromValue(optimizedValue.value).slice(0, initialEnumCount.value),
)
const remainingEnumValues = computed(() =>
  getEnumFromValue(optimizedValue.value).slice(initialEnumCount.value),
)

/** Simplified discriminators with `null` type. */
const optimizedValue = computed(() => optimizeValueForDisplay(props.value))

// Display the property heading if any of the following are true
const displayPropertyHeading = (
  value?: Record<string, any>,
  name?: string,
  additional?: boolean,
  pattern?: boolean,
  required?: boolean,
) => {
  return (
    name ||
    additional ||
    pattern ||
    value?.deprecated ||
    value?.const ||
    (value?.enum && value.enum.length === 1) ||
    value?.type ||
    value?.nullable === true ||
    value?.writeOnly ||
    value?.readOnly ||
    required
  )
}
</script>
<template>
  <component
    :is="is ?? 'li'"
    class="property"
    :class="[
      !displayDescription(description, optimizedValue) ? '' : '',
      `property--level-${level}`,
      {
        'property--compact': compact,
        'property--deprecated': optimizedValue?.deprecated,
      },
    ]">
    <SchemaPropertyHeading
      v-if="
        displayPropertyHeading(
          optimizedValue,
          name,
          additional,
          pattern,
          required,
        )
      "
      :additional="additional"
      :enum="getEnumFromValue(optimizedValue).length > 0"
      :pattern="pattern"
      :required="required"
      :value="optimizedValue"
      :schemas="schemas">
      <template
        v-if="name"
        #name>
        {{ name }}
      </template>
      <template
        v-if="optimizedValue?.example"
        #example>
        Example:
        {{ optimizedValue.example }}
      </template>
    </SchemaPropertyHeading>
    <!-- Description -->
    <div
      v-if="displayDescription(description, optimizedValue)"
      class="property-description">
      <ScalarMarkdown
        :value="displayDescription(description, optimizedValue)" />
    </div>
    <div
      v-else-if="generatePropertyDescription(optimizedValue)"
      class="property-description">
      <ScalarMarkdown
        :value="generatePropertyDescription(optimizedValue) || ''" />
    </div>
    <!-- Enum -->
    <div
      v-if="getEnumFromValue(optimizedValue)?.length > 0"
      class="property-enum">
      <template v-if="Array.isArray(optimizedValue?.['x-enumDescriptions'])">
        <div class="property-list">
          <div
            v-for="enumValue in getEnumFromValue(optimizedValue)"
            :key="enumValue"
            class="property">
            <div class="property-heading">
              <div class="property-name">
                {{ enumValue }}
              </div>
            </div>
            <div class="property-description">
              <ScalarMarkdown
                :value="optimizedValue['x-enumDescriptions'][enumValue]" />
            </div>
          </div>
        </div>
      </template>
      <template v-else>
        <ul class="property-enum-values">
          <li
            v-for="enumValue in visibleEnumValues"
            :key="enumValue"
            class="property-enum-value">
            <span class="property-enum-value-label">
              {{ enumValue }}
            </span>
          </li>
          <Disclosure
            v-if="hasLongEnumList"
            v-slot="{ open }">
            <DisclosurePanel>
              <li
                v-for="enumValue in remainingEnumValues"
                :key="enumValue"
                class="property-enum-value">
                <span class="property-enum-value-label">
                  {{ enumValue }}
                </span>
              </li>
            </DisclosurePanel>
            <DisclosureButton class="enum-toggle-button">
              <ScalarIcon
                class="enum-toggle-button-icon"
                :class="{ 'enum-toggle-button-icon--open': open }"
                icon="Add"
                size="sm" />
              {{ open ? 'Hide values' : 'Show all values' }}
            </DisclosureButton>
          </Disclosure>
        </ul>
      </template>
    </div>
    <!-- Object -->
    <div
      v-if="
        optimizedValue?.type === 'object' &&
        (optimizedValue?.properties || optimizedValue?.additionalProperties)
      "
      class="children">
      <Schema
        :compact="compact"
        :level="level + 1"
        :name="name"
        :noncollapsible="noncollapsible"
        :value="optimizedValue"
        :schemas="schemas" />
    </div>
    <!-- Array of objects -->
    <template
      v-if="
        optimizedValue?.items &&
        typeof optimizedValue.items === 'object' &&
        'type' in optimizedValue.items &&
        typeof optimizedValue.items.type === 'string'
      ">
      <div
        v-if="['object'].includes(optimizedValue?.items?.type)"
        class="children">
        <Schema
          :compact="compact"
          :level="level + 1"
          :name="name"
          :noncollapsible="noncollapsible"
          :value="optimizedValue.items" />
      </div>
    </template>
    <!-- Discriminators -->
    <template
      v-for="discriminator in discriminators"
      :key="discriminator">
      <!-- Property discriminator -->
      <template v-if="optimizedValue?.[discriminator]">
        <SchemaDiscriminator
          :compact="compact"
          :discriminator="discriminator"
          :hideHeading="hideHeading"
          :level="level"
          :name="name"
          :noncollapsible="noncollapsible"
          :schemas="schemas"
          :value="optimizedValue" />
      </template>

      <!-- Array item discriminator -->
      <template
        v-else-if="
          optimizedValue?.items &&
          typeof discriminator === 'string' &&
          typeof optimizedValue.items === 'object' &&
          !('type' in optimizedValue.items) &&
          discriminator in optimizedValue.items
        ">
        <SchemaDiscriminator
          :compact="compact"
          :discriminator="discriminator"
          :hideHeading="hideHeading"
          :level="level"
          :name="name"
          :noncollapsible="noncollapsible"
          :schemas="schemas"
          :value="optimizedValue.items" />
      </template>
    </template>
    <SpecificationExtension :value="optimizedValue" />
  </component>
</template>

<style scoped>
.property {
  color: var(--scalar-color-1);
  display: flex;
  flex-direction: column;
  padding: 8px;
  font-size: var(--scalar-mini);
  position: relative;
}
/* increase z-index for example hovers */
.property:hover {
  z-index: 1;
}
.property--compact.property--level-0,
.property--compact.property--level-1 {
  padding: 8px 0;
}
.property--compact.property--level-0
  .discriminator-panel
  .property--compact.property--level-1 {
  padding: 8px;
}
.property--deprecated {
  background: repeating-linear-gradient(
    -45deg,
    var(--scalar-background-2) 0,
    var(--scalar-background-2) 2px,
    transparent 2px,
    transparent 5px
  );
  background-size: 100%;
}
.property--deprecated > * {
  opacity: 0.75;
}
.property-description {
  margin-top: 6px;
  line-height: 1.4;
  font-size: var(--scalar-small);
}
.property-heading:empty + .property-description:last-of-type,
.property-description:first-of-type:last-of-type {
  margin-top: 0;
}
.property-description:has(+ .property-rule) {
  margin-bottom: 9px;
}
:deep(.property-description) * {
  color: var(--scalar-color-2) !important;
}

.property:not(:last-of-type) {
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
}
.property-description + .children {
  margin-top: 9px;
}
.children {
  display: flex;
  flex-direction: column;
}
.children .property--compact.property--level-1 {
  padding: 12px;
}

.property-example-value {
  all: unset;
  font-family: var(--scalar-font-code);
  padding: 6px;
  border-top: var(--scalar-border-width) solid var(--scalar-border-color);
}
.property-rule {
  border-radius: var(--scalar-radius-lg);
  display: flex;
  flex-direction: column;
}
.property-rule
  :deep(
    .discriminator-panel .schema-card .schema-properties.schema-properties-open
  ) {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}
.property-rule :deep(.discriminator-panel .discriminator-selector) {
  border-top: 0;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}
.property-rule
  :deep(
    .discriminator-panel:has(.property-rule)
      > .schema-card
      .schema-properties.schema-properties-open
  ) {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
.property-enum-value {
  color: var(--scalar-color-3);
  line-height: 1.5;
  word-break: break-word;
  display: flex;
  align-items: stretch;
  position: relative;
}
.property-enum-value-label {
  display: flex;
  padding: 3px 0;
  font-family: var(--scalar-font-code);
}
.property-enum-value:last-of-type .property-enum-value-label {
  padding-bottom: 0;
}
.property-enum-value::before {
  content: '';
  margin-right: 12px;
  width: var(--scalar-border-width);
  display: block;
  background: currentColor;
  color: var(--scalar-color-3);
}
.property-enum-value:after {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  width: 8px;
  height: var(--scalar-border-width);
  background: currentColor;
}
.property-enum-value:last-of-type::after {
  bottom: 0;
  height: 50%;
  background: var(--scalar-background-1);
  border-top: var(--scalar-border-width) solid currentColor;
}
.property-enum-values {
  margin-top: 8px;
  list-style: none;
}
.property-example {
  background: transparent;
  border: none;
  display: flex;
  flex-direction: row;
  gap: 8px;
}
.property-example-label,
.property-example-value {
  padding: 3px 0 0 0;
}
.property-example-value {
  background: var(--scalar-background-2);
  border-top: 0;
  border-radius: var(--scalar-radius);
  padding: 3px 4px;
}
.property-list {
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-radius: var(--scalar-radius);
  margin-top: 10px;
}
.property-list .property:last-of-type {
  padding-bottom: 10px;
}
.property-name {
  font-family: var(--scalar-font-code);
  font-weight: var(--scalar-semibold);
}
.enum-toggle-button {
  align-items: center;
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-radius: 13.5px;
  cursor: pointer;
  color: var(--scalar-color-2);
  display: flex;
  font-weight: var(--scalar-semibold);
  gap: 4px;
  margin-top: 8px;
  padding: 6px 10px;
  user-select: none;
  white-space: nowrap;
}
.enum-toggle-button:hover {
  color: var(--scalar-color-1);
}
.enum-toggle-button-icon--open {
  transform: rotate(45deg);
}
</style>
