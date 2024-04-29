<script lang="ts" setup>
import { MarkdownRenderer } from '../../MarkdownRenderer'
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

const getEnumFromValue = function (value?: Record<string, any>): any[] | null {
  return value?.enum || value?.items?.enum || null
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
      :enum="!!getEnumFromValue(value)"
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
      <MarkdownRenderer :value="displayDescription(description, value)" />
    </div>
    <div
      v-else-if="generatePropertyDescription(value)"
      class="property-description">
      <MarkdownRenderer :value="generatePropertyDescription(value) || ''" />
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
    <!-- Enum -->
    <div
      v-if="getEnumFromValue(value)"
      class="property-enum">
      <ul class="property-enum-values">
        <li
          v-for="enumValue in getEnumFromValue(value)"
          :key="enumValue"
          class="property-enum-value">
          {{ enumValue }}
        </li>
      </ul>
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
  padding: 10px 0;
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

:deep(.property-description) * {
  color: var(--scalar-color-2) !important;
}

.property:not(:last-of-type) {
  border-bottom: 1px solid var(--scalar-border-color);
}
.children {
  display: flex;
  flex-direction: column;

  padding-top: 8px;
}

.property-example {
  display: flex;
  flex-direction: column;
  gap: 6px;

  margin-top: 6px;
  padding: 6px;

  max-height: calc(((var(--full-height) - var(--refs-header-height))) / 2);

  font-size: var(--scalar-micro);
  border: 1px solid var(--scalar-border-color);
  background: var(--scalar-background-2);
  border-radius: var(--scalar-radius-lg);
}

.property-example-label {
  font-weight: var(--scalar-semibold);
  color: var(--scalar-color-3);
}
.property-example-value {
  font-family: var(--scalar-font-code);
  white-space: pre;
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
  content: '◼';
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
</style>
