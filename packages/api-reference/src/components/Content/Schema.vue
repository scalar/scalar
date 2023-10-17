<script lang="ts" setup>
import Schema from './Schema.vue'

withDefaults(
  defineProps<{
    value?: Record<string, any>
    level?: number
  }>(),
  {
    level: 0,
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

const generatePropertyDescription = (property: {
  type: string
  format?: string
}) => {
  if (descriptions[property.type]) {
    return descriptions[property.type][property.format || '_default']
  }
}

const rules = ['oneOf', 'anyOf', 'allOf', 'not']
</script>
<template>
  <div class="schema">
    <div
      v-if="value?.properties"
      class="properties">
      <div class="type">
        <span
          class="type-icon"
          :title="value.type">
          <template v-if="value.type === 'object'"> {} </template>
          <template v-if="value.type === 'array'"> [] </template>
        </span>
        <template v-if="value?.xml?.name && value?.xml?.name !== '##default'">
          &lt;{{ value?.xml?.name }} /&gt;
        </template>
        <template v-else>
          {{ value.type }}
        </template>
      </div>
      <div
        v-for="property in Object.keys(value.properties)"
        :key="property"
        class="property">
        <div class="property-information">
          <div class="property-name">
            {{ property
            }}<span
              v-if="value?.required?.includes(property)"
              class="required"
              v-text="'*'" />
          </div>
          <div
            v-if="value?.required?.includes(property)"
            class="required">
            required
          </div>
          <div
            v-if="value.properties[property].type"
            class="property-type">
            <template v-if="value.properties[property].type !== 'object'">
              <template
                v-if="
                  value.properties[property]?.items &&
                  !['object'].includes(value.properties[property].items.type)
                ">
                {{ value.properties[property].type }}
                {{ value.properties[property].items.type }}[]
              </template>
              <template v-else>
                {{ value.properties[property].type }}
              </template>
              <template
                v-if="
                  value.properties[property].minItems ||
                  value.properties[property].maxItems
                ">
                {{ value.properties[property].minItems }}..{{
                  value.properties[property].maxItems
                }}
              </template>
              <template v-if="value.properties[property].uniqueItems">
                unique!
              </template>
            </template>
            <template v-if="value.properties[property].format">
              &middot; {{ value.properties[property].format }}
            </template>
            <template v-if="value.properties[property].enum">
              &middot; enum
            </template>
          </div>
          <div
            v-if="value.properties[property].example"
            class="property-example">
            <code class="property-example-value">
              example: {{ value.properties[property].example }}
            </code>
          </div>
          <template
            v-for="rule in rules"
            :key="rule">
            <div
              v-if="value.properties[property][rule]"
              class="property-rule">
              {{ rule }}
            </div>
          </template>
        </div>
        <!-- Description -->
        <div
          v-if="value.properties[property].description"
          class="property-description">
          {{ value.properties[property].description }}
        </div>
        <div
          v-else-if="generatePropertyDescription(value.properties[property])"
          class="property-description">
          {{ generatePropertyDescription(value.properties[property]) }}
        </div>
        <!-- Enum -->
        <div
          v-if="value.properties[property].enum"
          class="property-enum">
          <ul class="property-enum-values">
            <li
              v-for="enumValue in value.properties[property].enum"
              :key="enumValue"
              class="property-enum-value">
              {{ enumValue }}
            </li>
          </ul>
        </div>
        <!-- Object -->
        <div
          v-if="value.properties[property].properties"
          class="children">
          <Schema
            v-if="level < 3"
            :level="level + 1"
            :value="value.properties[property]" />
        </div>
        <!-- Array of objects -->
        <template v-if="value.properties[property].items">
          <div
            v-if="['object'].includes(value.properties[property].items.type)"
            class="children">
            <Schema
              v-if="level < 3"
              :level="level + 1"
              :value="value.properties[property].items" />
          </div>
        </template>
        <!-- oneOf -->
        <template
          v-for="rule in rules"
          :key="rule">
          <div
            v-if="value.properties[property][rule]"
            class="rule">
            <Schema
              v-for="(schema, index) in value.properties[property][rule]"
              :key="index"
              :level="level + 1"
              :value="schema" />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.schema {
  max-width: 600px;
  width: 100%;
  font-size: var(--default-theme-font-size-3, var(--default-theme-font-size-3));
  color: var(--theme-color-1, var(--default-theme-color-1));
}

.type {
  font-size: var(--default-theme-font-size-4, var(--default-theme-font-size-4));
  color: var(--theme-color-2, var(--default-theme-color-2));
  font-family: var(--theme-font-code, var(--default-theme-font-code));
  font-weight: var(--theme-bold, var(--default-theme-bold));
  text-transform: uppercase;
  background: var(--theme-background-4, var(--default-theme-background-4));
  padding: 10px 12px;
}

.type-icon {
  color: var(--theme-color-1, var(--default-theme-color-1));
  font-size: var(--default-theme-font-size-3, var(--default-theme-font-size-3));
}

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

.properties {
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  margin: 16px 0 0;
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
  overflow: hidden;
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
  content: '▶';
  margin-right: 6px;
  color: var(--theme-color-3, var(--default-theme-color-3));
}
.property-enum-values {
  margin-top: 12px;
}
</style>
