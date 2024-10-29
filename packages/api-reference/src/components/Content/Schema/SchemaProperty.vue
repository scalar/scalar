<script lang="ts" setup>
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ScalarIcon, ScalarMarkdown } from '@scalar/components'

import Schema from './Schema.vue'
import SchemaPropertyHeading from './SchemaPropertyHeading.vue'

withDefaults(
  defineProps<{
    value?: Record<string, any>
    level?: number
    name?: string
    required?: boolean
    compact?: boolean
    description?: string
    additional?: boolean
  }>(),
  {
    level: 0,
    required: false,
    compact: false,
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

const rules = ['oneOf', 'anyOf', 'allOf', 'not']
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
      :enum="getEnumFromValue(value).length > 1"
      :required="required"
      :value="value">
      <template
        v-if="name"
        #name>
        {{ name }}
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
      v-if="value?.example || value?.items?.example"
      class="property-example custom-scroll">
      <span class="property-example-label">Example</span>
      <code class="property-example-value">{{
        value.example || value?.items.example
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
      v-if="getEnumFromValue(value)?.length > 1"
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
            v-for="enumValue in getEnumFromValue(value).slice(0, 4)"
            :key="enumValue"
            class="property-enum-value">
            {{ enumValue }}
          </li>
          <Disclosure
            v-if="getEnumFromValue(value).length > 4"
            v-slot="{ open }">
            <DisclosurePanel>
              <li
                v-for="enumValue in getEnumFromValue(value).slice(4)"
                :key="enumValue"
                class="property-enum-value">
                {{ enumValue }}
              </li>
            </DisclosurePanel>
            <DisclosureButton class="enum-toggle-button">
              <ScalarIcon
                class="enum-toggle-button-icon h-2.5"
                :class="{ 'enum-toggle-button-icon--open': open }"
                icon="Add"
                thickness="3" />
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
    <!-- oneOf -->
    <template
      v-for="rule in rules"
      :key="rule">
      <!-- Property -->
      <div
        v-if="value?.[rule]"
        class="property-rule">
        <template
          v-for="(schema, index) in value[rule]"
          :key="index">
          <Schema
            :compact="compact"
            :level="level + 1"
            :value="schema" />
        </template>
      </div>
      <!-- Arrays -->
      <div
        v-if="value?.items?.[rule] && level < 3"
        class="property-rule">
        <Schema
          v-for="(schema, index) in value.items[rule]"
          :key="index"
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
  font-family: var(--scalar-font-code);
  white-space: pre;
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
  display: none;
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
