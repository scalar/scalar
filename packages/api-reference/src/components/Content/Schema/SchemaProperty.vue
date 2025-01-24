<script lang="ts" setup>
import { formatExample } from '@/components/Content/Schema/helpers/formatExample'
import {
  discriminators,
  optimizeValueForDisplay,
} from '@/components/Content/Schema/helpers/optimizeValueForDisplay'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ScalarIcon, ScalarMarkdown } from '@scalar/components'
import { computed } from 'vue'

import Schema from './Schema.vue'
import SchemaPropertyHeading from './SchemaPropertyHeading.vue'

const props = withDefaults(
  defineProps<{
    value?: Record<string, any>
    level?: number
    name?: string
    required?: boolean
    compact?: boolean
    description?: string
    additional?: boolean
    pattern?: boolean
    withExamples?: boolean
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

const displayDescription = function (
  description: string | undefined,
  value?: Record<string, any>,
) {
  if (value?.properties) {
    return null
  }

  if (value?.additionalProperties) {
    return null
  }

  if (value?.patternProperties) {
    return null
  }

  return description || value?.description || null
}

const generatePropertyDescription = function (property?: Record<string, any>) {
  if (!property) {
    return null
  }

  if (!descriptions[property.type]) {
    return null
  }

  return descriptions[property.type][property.format || '_default']
}

const getEnumFromValue = function (value?: Record<string, any>): any[] | [] {
  return value?.enum || value?.items?.enum || []
}

// These helpers manage how enum values are displayed:
//
// - For enums with 9 or fewer values, all values are shown.
// - For enums with more than 9 values, only first 5 are shown initially.
// - A “Show more” button reveals the remaining values.
const hasLongEnumList = computed(() => getEnumFromValue(props.value).length > 9)
const initialEnumCount = computed(() => (hasLongEnumList.value ? 5 : 9))
const visibleEnumValues = computed(() =>
  getEnumFromValue(props.value).slice(0, initialEnumCount.value),
)
const remainingEnumValues = computed(() =>
  getEnumFromValue(props.value).slice(initialEnumCount.value),
)

/** Simplified discriminators with `null` type. */
const optimizedValue = computed(() => optimizeValueForDisplay(props.value))
</script>
<template>
  <div
    class="property"
    :class="[
      `property--level-${level}`,
      {
        'property--compact': compact,
        'property--deprecated': value?.deprecated,
      },
    ]">
    <SchemaPropertyHeading
      :additional="additional"
      :pattern="pattern"
      :enum="getEnumFromValue(value).length > 0"
      :required="required"
      :value="optimizedValue">
      <template
        v-if="name"
        #name>
        {{ name }}
      </template>
      <template
        v-if="value?.example"
        #example>
        Example:
        {{ value.example }}
      </template>
    </SchemaPropertyHeading>
    <!-- Description -->
    <div
      v-if="displayDescription(description, value)"
      class="property-description">
      <ScalarMarkdown :value="displayDescription(description, value)" />
    </div>
    <div
      v-else-if="generatePropertyDescription(value)"
      class="property-description">
      <ScalarMarkdown :value="generatePropertyDescription(value) || ''" />
    </div>
    <!-- Example -->
    <div
      v-if="withExamples && (value?.example || value?.items?.example)"
      class="property-example custom-scroll">
      <span class="property-example-label">Example</span>
      <code class="property-example-value">{{
        formatExample(value.example || value?.items.example)
      }}</code>
    </div>
    <template
      v-if="
        value?.examples &&
        typeof value.examples === 'object' &&
        Object.keys(value.examples).length > 0
      ">
      <div class="property-example custom-scroll">
        <span class="property-example-label">
          {{
            Object.keys(value.examples).length === 1 ? 'Example' : 'Examples'
          }}
        </span>
        <code
          v-for="(example, key) in value.examples"
          :key="key"
          class="property-example-value">
          {{ example }}
        </code>
      </div>
    </template>
    <!-- Enum -->
    <div
      v-if="getEnumFromValue(value)?.length > 0"
      class="property-enum">
      <template v-if="value?.['x-enumDescriptions']">
        <div class="property-list">
          <div
            v-for="enumValue in getEnumFromValue(value)"
            :key="enumValue"
            class="property">
            <div class="property-heading">
              <div class="property-name">
                {{ enumValue }}
              </div>
            </div>
            <div class="property-description">
              <ScalarMarkdown :value="value['x-enumDescriptions'][enumValue]" />
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
            {{ enumValue }}
          </li>
          <Disclosure
            v-if="hasLongEnumList"
            v-slot="{ open }">
            <DisclosurePanel>
              <li
                v-for="enumValue in remainingEnumValues"
                :key="enumValue"
                class="property-enum-value">
                {{ enumValue }}
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
        value?.type === 'object' &&
        (value?.properties || value?.additionalProperties)
      "
      class="children">
      <Schema
        :compact="compact"
        :level="level + 1"
        :value="value" />
    </div>
    <!-- Array of objects -->
    <template v-if="value?.items">
      <div
        v-if="['object'].includes(value.items.type)"
        class="children">
        <Schema
          :compact="compact"
          :level="level + 1"
          :value="value.items" />
      </div>
    </template>
    <!-- Discriminators -->
    <template
      v-for="discriminator in discriminators"
      :key="discriminator">
      <!-- Property -->
      <div
        v-if="optimizedValue?.[discriminator]"
        class="property-rule">
        <template
          v-for="schema in optimizedValue[discriminator]"
          :key="schema.id">
          <Schema
            :compact="compact"
            :level="level + 1"
            :noncollapsible="value?.[discriminator].length === 1"
            :value="schema" />
        </template>
      </div>
      <!-- Arrays -->
      <div
        v-if="value?.items?.[discriminator] && level < 3"
        class="property-rule">
        <Schema
          v-for="schema in value.items[discriminator]"
          :key="schema.id"
          :compact="compact"
          :level="level + 1"
          :value="schema" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.property {
  color: var(--scalar-color-1);
  padding: 10px;
  font-size: var(--scalar-mini);
}

.property:last-of-type {
  padding-bottom: 0;
}

.property--compact.property--level-0 {
  padding: 12px 0;
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
:deep(.property-description) * {
  color: var(--scalar-color-2) !important;
}

.property:not(:last-of-type) {
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
}
.children {
  display: flex;
  flex-direction: column;

  padding-top: 8px;
}

.property-example {
  display: flex;
  flex-direction: column;

  margin-top: 6px;

  max-height: calc(((var(--full-height) - var(--refs-header-height))) / 2);

  font-size: var(--scalar-micro);
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  background: var(--scalar-background-2);
  border-radius: var(--scalar-radius-lg);
}

.property-example-label {
  font-weight: var(--scalar-semibold);
  color: var(--scalar-color-3);

  padding: 6px;
}
.property-example-value {
  all: unset;
  font-family: var(--scalar-font-code);
  padding: 6px;
  border-top: var(--scalar-border-width) solid var(--scalar-border-color);
}

.property-rule {
  display: flex;
  flex-direction: column;
  gap: 6px;

  margin-top: 12px;
  border-radius: var(--scalar-radius-lg);
}

.property-enum-value {
  padding: 3px 0;
  color: var(--scalar-color-2);
  line-height: 1.5;
  word-break: break-word;
}
.property-enum-value::before {
  content: '⊢';
  margin-right: 6px;
  color: var(--scalar-color-3);
}
.property-enum-values {
  margin-top: 8px;
  list-style: none;
}

.property--compact .property-example {
  background: transparent;
  border: none;
  display: flex;
  flex-direction: row;
  gap: 8px;
}
.property--compact .property-example-label,
.property--compact .property-example-value {
  padding: 3px 0 0 0;
}
.property--compact .property-example-value {
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
