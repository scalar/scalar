<script lang="ts" setup>
import { Badge } from '../../Badge'
import { MarkdownRenderer } from '../../MarkdownRenderer'
import Schema from './Schema.vue'

withDefaults(
  defineProps<{
    value?: Record<string, any>
    level?: number
    name?: string
    required?: boolean
    compact?: boolean
    description?: string
  }>(),
  {
    level: 0,
    required: false,
    compact: false,
  },
)

const descriptions: Record<string, Record<string, string>> = {
  number: {
    _default: '',
    float: 'Floating-point numbers.',
    double: 'Floating-point numbers with double precision.',
  },
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
    <div class="property-information">
      <div
        v-if="name"
        class="property-name">
        {{ name }}
      </div>
      <div
        v-if="value?.deprecated"
        class="property-deprecated">
        <Badge>deprecated</Badge>
      </div>
      <div
        v-if="required"
        class="required">
        required
      </div>
      <div
        v-if="value?.type"
        class="property-type">
        <template v-if="value?.items && !['object'].includes(value.items.type)">
          {{ value.type }}
          {{ value.items.type }}[]
        </template>
        <template v-else>
          {{ Array.isArray(value.type) ? value.type.join(' | ') : value.type }}
          {{ value?.nullalbe ? ' | nullable' : '' }}
        </template>
        <template v-if="value.minItems || value.maxItems">
          {{ value.minItems }}..{{ value.maxItems }}
        </template>
        <template v-if="value.minLength">
          &middot; min: {{ value.minLength }}
        </template>
        <template v-if="value.maxLength">
          &middot; max: {{ value.maxLength }}
        </template>
        <template v-if="value.uniqueItems"> unique! </template>
        <template v-if="value.format"> &middot; {{ value.format }} </template>
        <template v-if="value.minimum">
          &middot; min: {{ value.minimum }}
        </template>
        <template v-if="value.maximum">
          &middot; max: {{ value.maximum }}
        </template>
        <template v-if="value.pattern">
          &middot; <code class="pattern">{{ value.pattern }}</code>
        </template>
        <template v-if="getEnumFromValue(value)"> &middot; enum </template>
        <template v-if="value.default">
          &middot; default: {{ value.default }}
        </template>
      </div>
      <div
        v-if="value?.writeOnly"
        class="write-only">
        write-only
      </div>
      <div
        v-else-if="value?.readOnly"
        class="read-only">
        read-only
      </div>
      <template
        v-for="rule in rules"
        :key="rule">
        <div
          v-if="value?.[rule] || value?.items?.[rule]"
          class="property-rule-badge">
          <Badge>{{ rule }}</Badge>
        </div>
      </template>
    </div>
    <!-- Description -->
    <div
      v-if="description || value?.description"
      class="property-description">
      <MarkdownRenderer :value="description || value?.description" />
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
  color: var(--theme-color-1, var(--default-theme-color-1));
  padding: 10px;
  font-size: var(--theme-mini, var(--default-theme-mini));
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
    var(--theme-background-2, var(--default-theme-background-2)) 0,
    var(--theme-background-2, var(--default-theme-background-2)) 2px,
    transparent 2px,
    transparent 5px
  );
  background-size: 100%;
}

.property--deprecated > * {
  opacity: 0.75;
}

.property-information {
  display: flex;
  align-items: center;
  gap: 9px;
  white-space: nowrap;
}

.property-description {
  margin-top: 6px;
  line-height: 1.4;
}

:deep(.property-description) * {
  color: var(--theme-color-2, var(--default-theme-color-2)) !important;
}

.property:not(:last-of-type) {
  border-bottom: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}
.children {
  display: flex;
  flex-direction: column;

  padding-top: 8px;
}

.property-name {
  font-family: var(--theme-font-code, var(--default-theme-font-code));
}

.required,
.optional {
  color: var(--theme-color-2, var(--default-theme-color-2));
}

.required {
  text-transform: uppercase;
  color: var(--theme-color-orange, var(--default-theme-color-orange));
}

.read-only,
.write-only {
  font-size: var(--theme-font-size-3, var(--default-theme-font-size-3));
  color: var(--theme-color-blue, var(--default-theme-color-blue));
}

.property-type {
  font-size: var(--theme-font-size-3, var(--default-theme-font-size-3));
  color: var(--theme-color-2, var(--default-theme-color-2));
}

.property-example {
  display: flex;
  flex-direction: column;
  gap: 6px;

  margin-top: 6px;
  padding: 6px;

  max-height: calc(((var(--full-height) - var(--refs-header-height))) / 2);

  font-size: var(--default-theme-micro, var(--default-default-theme-micro));
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  background: var(--theme-background-2, var(--default-theme-background-2));
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
}

.property-example-label {
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  color: var(--theme-color-3, var(--default-theme-color-3));
}
.property-example-value {
  font-family: var(--theme-font-code, var(--default-theme-font-code));
  white-space: pre;
}

.pattern {
  font-family: var(--theme-font-code, var(--default-theme-font-code));
  font-size: var(--theme-font-size-3, var(--default-theme-font-size-3));
  color: var(--theme-color-2, var(--default-theme-color-2));
  background: var(--theme-background-3, var(--default-theme-background-3));
  padding: 1px 3px;
  border-radius: var(--theme-radius, var(--default-theme-radius));
}

.property-rule {
  display: flex;
  flex-direction: column;
  gap: 6px;

  margin-top: 12px;
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
}

.property-enum-value {
  padding: 3px 0;
  color: var(--theme-color-2, var(--default-theme-color-2));
}
.property-enum-value::before {
  content: '◼';
  margin-right: 6px;
  color: var(--theme-color-3, var(--default-theme-color-3));
}
.property-enum-values {
  margin-top: 8px;
  list-style: none;
}

.property-read-only {
  font-family: var(--theme-font-code, var(--default-theme-font-code));
}

.property--compact .property-example {
  display: none;
}
</style>
