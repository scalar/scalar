<script lang="ts" setup>
import { Badge } from '../../Badge'
import SchemaPropertyDetail from './SchemaPropertyDetail.vue'

withDefaults(
  defineProps<{
    value?: Record<string, any>
    enum?: boolean
    required?: boolean
    additional?: boolean
  }>(),
  {
    level: 0,
    required: false,
  },
)

const rules = ['oneOf', 'anyOf', 'allOf', 'not']
</script>
<template>
  <div class="property-heading">
    <div
      v-if="$slots.name"
      class="property-name">
      <slot name="name" />
    </div>
    <div
      v-if="additional"
      class="property-additional">
      additional properties
    </div>
    <div
      v-if="value?.deprecated"
      class="property-deprecated">
      <Badge>deprecated</Badge>
    </div>
    <div
      v-if="required"
      class="property-required">
      required
    </div>
    <div
      v-if="value?.type"
      class="property-details">
      <SchemaPropertyDetail v-if="additional">
        <template #prefix>key:</template>
        string
      </SchemaPropertyDetail>
      <SchemaPropertyDetail>
        <!-- prettier-ignore -->
        <template v-if="additional" #prefix>value:</template >
        <template v-if="value?.items?.type">
          {{ value.type }}
          {{ value.items.type }}[]
        </template>
        <template v-else>
          {{ Array.isArray(value.type) ? value.type.join(' | ') : value.type }}
          {{ value?.nullable ? ' | nullable' : '' }}
        </template>
        <template v-if="value.minItems || value.maxItems">
          {{ value.minItems }}&hellip;{{ value.maxItems }}
        </template>
      </SchemaPropertyDetail>
      <SchemaPropertyDetail v-if="value.minLength">
        <template #prefix>min:</template>
        {{ value.minLength }}
      </SchemaPropertyDetail>
      <SchemaPropertyDetail v-if="value.maxLength">
        <template #prefix>max:</template>
        {{ value.maxLength }}
      </SchemaPropertyDetail>
      <SchemaPropertyDetail v-if="value.uniqueItems">
        unique!
      </SchemaPropertyDetail>
      <SchemaPropertyDetail v-if="value.format">{{
        value.format
      }}</SchemaPropertyDetail>
      <SchemaPropertyDetail v-if="value.minimum">
        <template #prefix>min:</template>
        {{ value.minimum }}
      </SchemaPropertyDetail>
      <SchemaPropertyDetail v-if="value.maximum">
        <template #prefix>max:</template>
        {{ value.maximum }}
      </SchemaPropertyDetail>
      <SchemaPropertyDetail
        v-if="value.pattern"
        code
        truncate>
        {{ value.pattern }}
      </SchemaPropertyDetail>
      <SchemaPropertyDetail v-if="$props.enum">enum</SchemaPropertyDetail>
      <SchemaPropertyDetail
        v-if="value.default"
        truncate>
        <template #prefix>default:</template>
        {{ value.default }}
      </SchemaPropertyDetail>
    </div>
    <div
      v-if="value?.writeOnly"
      class="property-write-only">
      write-only
    </div>
    <div
      v-else-if="value?.readOnly"
      class="property-read-only">
      read-only
    </div>
    <template
      v-for="rule in rules.filter((r) => value?.[r] || value?.items?.[r])"
      :key="rule">
      <Badge>{{ rule }}</Badge>
    </template>
  </div>
</template>
<style scoped>
.property-heading {
  display: flex;
  align-items: center;
  gap: 9px;
  white-space: nowrap;
}

.property-name {
  font-family: var(--scalar-font-code);
}
.property-additional {
  font-size: var(--scalar-font-size-3);
}

.property-required,
.property-optional {
  color: var(--scalar-color-2);
}

.property-required {
  text-transform: uppercase;
  color: var(--scalar-color-orange);
}

.property-read-only,
.property-write-only {
  font-size: var(--scalar-font-size-3);
  color: var(--scalar-color-blue);
}

.property-details {
  font-size: var(--scalar-font-size-3);
  color: var(--scalar-color-2);

  display: flex;
  align-items: center;

  min-width: 0;
}
</style>
