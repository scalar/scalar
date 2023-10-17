<script lang="ts" setup>
import Schema from './Schema.vue'

withDefaults(
  defineProps<{
    value?: Record<string, any>
    level?: number
    name?: string
    required?: boolean
  }>(),
  {
    level: 0,
    required: false,
  },
)

const descriptions: Record<string, Record<string, string>> = {
  number: {
    _default: 'Any numbers.',
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

const rules = ['oneOf', 'anyOf', 'allOf', 'not']
</script>

<template>
  <div class="property">
    <div class="property-information">
      <div
        v-if="name"
        class="property-name">
        {{ name
        }}<span
          v-if="required"
          class="required"
          v-text="'*'" />
      </div>
      <div
        v-if="required"
        class="required">
        required
      </div>
      <div
        v-if="value?.type"
        class="property-type">
        <template v-if="value.type !== 'object'">
          <template
            v-if="value?.items && !['object'].includes(value.items.type)">
            {{ value.type }}
            {{ value.items.type }}[]
          </template>
          <template v-else>
            {{ value.type }}
          </template>
          <template v-if="value.minItems || value.maxItems">
            {{ value.minItems }}..{{ value.maxItems }}
          </template>
          <template v-if="value.uniqueItems"> unique! </template>
        </template>
        <template v-if="value.format"> &middot; {{ value.format }} </template>
        <template v-if="value.enum"> &middot; enum </template>
      </div>
      <div
        v-if="value?.example !== undefined"
        class="property-example">
        <code class="property-example-value">
          example: {{ value.example }}
        </code>
      </div>
      <template
        v-for="rule in rules"
        :key="rule">
        <div
          v-if="value?.[rule]"
          class="property-rule">
          {{ rule }}
        </div>
      </template>
      <div
        v-if="value?.readOnly"
        class="property-read-only">
        read-only
      </div>
      <div
        v-if="value?.readOnly"
        class="property-nullable">
        nullable
      </div>
    </div>
    <!-- Description -->
    <div
      v-if="value?.description"
      class="property-description">
      {{ value.description }}
    </div>
    <div
      v-else-if="generatePropertyDescription(value)"
      class="property-description">
      {{ generatePropertyDescription(value) }}
    </div>
    <!-- Enum -->
    <div
      v-if="value?.enum"
      class="property-enum">
      <ul class="property-enum-values">
        <li
          v-for="enumValue in value.enum"
          :key="enumValue"
          class="property-enum-value">
          {{ enumValue }}
        </li>
      </ul>
    </div>
    <!-- Object -->
    <div
      v-if="value?.properties"
      class="children">
      <Schema
        v-if="level < 3"
        :level="level + 1"
        :value="value" />
      <div
        v-else
        class="too-deep">
        …
      </div>
    </div>
    <!-- Array of objects -->
    <template v-if="value?.items">
      <div
        v-if="['object'].includes(value.items.type)"
        class="children">
        <Schema
          v-if="level < 3"
          :level="level + 1"
          :value="value.items" />
        <div
          v-else
          class="too-deep">
          …
        </div>
      </div>
    </template>
    <!-- oneOf -->
    <template
      v-for="rule in rules"
      :key="rule">
      <div
        v-if="value?.[rule]"
        class="rule">
        <Schema
          v-for="(schema, index) in value[rule]"
          :key="index"
          :level="level + 1"
          :value="schema" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.property {
  padding: 12px 0;
}

.property-information {
  display: flex;
  align-items: end;
  gap: 16px;
}

.property-description {
  margin-top: 12px;
  color: var(--theme-color-2, var(--default-theme-color-2));
  line-height: 1.6;
}

.property-rule {
  font-family: var(--theme-font-code, var(--default-theme-font-code));
  background: var(--theme-color-orange, var(--default-theme-color-orange));
  padding: 0 6px;
}

.property:not(:last-of-type) {
  border-bottom: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}
.property-name {
  font-family: var(--theme-font-code, var(--default-theme-font-code));
}

.required,
.optional {
  color: var(--theme-color-2, var(--default-theme-color-2));
  font-size: var(
    --default-theme-font-size-5,
    var(--default-default-theme-font-size-5)
  );
}

.required {
  text-transform: uppercase;
  color: var(--theme-color-orange, var(--default-theme-color-orange));
}

.property-type {
  color: var(--theme-color-2, var(--default-theme-color-2));
}

.property {
  padding: 12px 12px;
}

.property-example {
  font-family: var(--theme-font-code, var(--default-theme-font-code));
}
.property-example-value {
  padding: 12px 12px;
  background: var(--theme-background-4, var(--default-theme-background-4));
  padding: 2px 5px;
  font-family: var(--theme-font-code, var(--default-theme-font-code));
  font-size: var(
    --default-theme-font-size-5,
    var(--default-default-theme-font-size-5)
  );
}

.rule {
  margin-top: 12px;
  padding: 0 12px 12px;
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
  background: var(--theme-background-4, var(--default-theme-background-4));
  border: 2px dotted
    var(--theme-border-color, var(--default-theme-border-color));
}

.property-enum-value {
  padding: 3px 0;
}
.property-enum-value::before {
  content: '◼';
  margin-right: 6px;
  color: var(--theme-color-3, var(--default-theme-color-3));
}
.property-enum-values {
  margin-top: 12px;
}

.property-read-only {
  font-family: var(--theme-font-code, var(--default-theme-font-code));
}

.property-nullable {
  font-family: var(--theme-font-code, var(--default-theme-font-code));
  color: var(--theme-color-2, var(--default-theme-color-2));
}
</style>
