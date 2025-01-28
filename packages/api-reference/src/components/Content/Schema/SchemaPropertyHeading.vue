<script lang="ts" setup>
import { Badge } from '../../Badge'
import SchemaPropertyDetail from './SchemaPropertyDetail.vue'

withDefaults(
  defineProps<{
    value?: Record<string, any>
    enum?: boolean
    required?: boolean
    additional?: boolean
    pattern?: boolean
  }>(),
  {
    level: 0,
    required: false,
  },
)

const discriminators = ['oneOf', 'anyOf', 'allOf', 'not']

const flattenDefaultValue = (value: Record<string, any>) => {
  return Array.isArray(value?.default) && value.default.length === 1
    ? value.default[0]
    : value?.default
}
</script>
<template>
  <div class="property-heading">
    <div
      v-if="$slots.name"
      class="property-name">
      <slot
        v-if="!pattern"
        name="name" />
      <template v-else>&sol;<slot name="name" />&sol;</template>
    </div>
    <div
      v-if="additional"
      class="property-additional">
      <template v-if="value?.['x-additionalPropertiesName']">
        {{ value['x-additionalPropertiesName'] }}
      </template>
      <template v-else>additional properties</template>
    </div>
    <div
      v-if="pattern"
      class="property-pattern">
      <Badge>pattern</Badge>
    </div>
    <div
      v-if="value?.deprecated"
      class="property-deprecated">
      <Badge>deprecated</Badge>
    </div>
    <div
      v-if="value?.const || (value?.enum && value.enum.length === 1)"
      class="property-const">
      <SchemaPropertyDetail truncate>
        <template #prefix>const:</template>
        {{ value.const ?? value.enum[0] }}
      </SchemaPropertyDetail>
    </div>
    <template v-else-if="value?.type">
      <SchemaPropertyDetail>
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
      <SchemaPropertyDetail
        v-if="value.minimum !== undefined && value.exclusiveMinimum">
        <template #prefix>greater than:</template>
        {{ value.minimum }}
      </SchemaPropertyDetail>
      <SchemaPropertyDetail
        v-if="value.minimum !== undefined && !value.exclusiveMinimum">
        <template #prefix>min:</template>
        {{ value.minimum }}
      </SchemaPropertyDetail>
      <SchemaPropertyDetail
        v-if="value.maximum !== undefined && value.exclusiveMaximum">
        <template #prefix>less than:</template>
        {{ value.maximum }}
      </SchemaPropertyDetail>
      <SchemaPropertyDetail
        v-if="value.maximum !== undefined && !value.exclusiveMaximum">
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
        v-if="value.default !== undefined"
        truncate>
        <template #prefix>default:</template>
        {{ flattenDefaultValue(value) }}
      </SchemaPropertyDetail>
    </template>
    <template v-else>
      <!-- Shows only when a discriminator is used (so value?.type is undefined) -->
      <SchemaPropertyDetail v-if="value?.nullable === true">
        nullable
      </SchemaPropertyDetail>
    </template>
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
      v-for="discriminator in discriminators.filter(
        (r) => value?.[r] || value?.items?.[r],
      )"
      :key="discriminator">
      <!-- Only show anyOf, oneOf, allOf if there are more than one schema -->
      <template v-if="value?.[discriminator]?.length > 1">
        <Badge>{{ discriminator }}</Badge>
      </template>
    </template>
    <div
      v-if="required"
      class="property-required">
      required
    </div>
  </div>
</template>
<style scoped>
.property-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  row-gap: 9px;
  white-space: nowrap;
}

.property-heading > * {
  margin-right: 9px;
}

.property-heading:last-child {
  margin-right: 0;
}

.property-heading > .property-detail:not(:last-of-type) {
  margin-right: 0;
}

.property-name {
  font-family: var(--scalar-font-code);
  font-weight: var(--scalar-semibold);
  font-size: var(--scalar-font-size-3);
  display: flex;
}

.property-additional {
  font-family: var(--scalar-font-code);
}

.property-required,
.property-optional {
  color: var(--scalar-color-2);
}

.property-required {
  font-size: var(--scalar-micro);
  color: var(--scalar-color-orange);
}

.property-read-only {
  font-size: var(--scalar-micro);
  color: var(--scalar-color-blue);
}

.property-write-only {
  font-size: var(--scalar-micro);
  color: var(--scalar-color-green);
}
.property-detail {
  font-size: var(--scalar-micro);
  color: var(--scalar-color-2);
  display: flex;
  align-items: center;

  min-width: 0;
}

.property-const {
  color: var(--scalar-color-1);
}
</style>
