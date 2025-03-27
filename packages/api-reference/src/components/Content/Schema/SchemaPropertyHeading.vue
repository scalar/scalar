<script lang="ts" setup>
import { ScalarIcon } from '@scalar/components'
import { useClipboard } from '@scalar/use-hooks/useClipboard'

import { formatExample } from '@/components/Content/Schema/helpers/formatExample'
import { discriminators } from '@/components/Content/Schema/helpers/optimizeValueForDisplay'
import ScreenReader from '@/components/ScreenReader.vue'

import { Badge } from '../../Badge'
import SchemaPropertyDetail from './SchemaPropertyDetail.vue'

const props = withDefaults(
  defineProps<{
    value?: Record<string, any>
    enum?: boolean
    required?: boolean
    additional?: boolean
    pattern?: boolean
    withExamples?: boolean
  }>(),
  {
    level: 0,
    required: false,
    withExamples: true,
  },
)

const discriminatorType = discriminators.find((r) => {
  if (!props.value || typeof props.value !== 'object') {
    return false
  }

  return (
    r in props.value ||
    (props.value.items &&
      typeof props.value.items === 'object' &&
      r in props.value.items)
  )
})

const flattenDefaultValue = (value: Record<string, any>) => {
  return Array.isArray(value?.default) && value.default.length === 1
    ? value.default[0]
    : value?.default
}

const { copyToClipboard } = useClipboard()
</script>
<template>
  <div class="property-heading">
    <div
      v-if="$slots.name"
      class="property-name"
      :class="{ deprecated: value?.deprecated }">
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
        <ScreenReader>Type:</ScreenReader>
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
      <SchemaPropertyDetail v-if="value.format">
        <ScreenReader>Format:</ScreenReader>
        {{ value.format }}
      </SchemaPropertyDetail>
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
        <ScreenReader>Pattern:</ScreenReader>
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
    <div
      v-if="required"
      class="property-required">
      required
    </div>
    <!-- example -->
    <div
      v-if="withExamples && (value?.example || value?.items?.example)"
      class="property-example">
      <button
        type="button"
        class="property-example-label">
        <span> Example </span>
      </button>
      <div class="property-example-value-list">
        <button
          type="button"
          class="property-example-value group"
          @click="
            copyToClipboard(
              formatExample(
                value?.example ||
                  (discriminatorType &&
                    value?.items &&
                    typeof value.items === 'object' &&
                    value.items[discriminatorType]),
              ),
            )
          ">
          <span>
            {{
              formatExample(
                value?.example ||
                  (discriminatorType &&
                    value?.items &&
                    typeof value.items === 'object' &&
                    value.items[discriminatorType]),
              )
            }}
          </span>
          <ScalarIcon
            icon="Clipboard"
            size="xs"
            class="group-hover:text-c-1 text-c-3 ml-auto min-h-3 min-w-3" />
        </button>
      </div>
    </div>
    <template
      v-if="
        value?.examples &&
        typeof value.examples === 'object' &&
        Object.keys(value.examples).length > 0
      ">
      <div class="property-example">
        <button
          type="button"
          class="property-example-label">
          <span>
            {{
              Object.keys(value.examples).length === 1 ? 'Example' : 'Examples'
            }}
          </span>
        </button>
        <div class="property-example-value-list">
          <button
            type="button"
            v-for="(example, key) in value.examples"
            :key="key"
            class="property-example-value group"
            @click="copyToClipboard(example)">
            <span>
              {{ example }}
            </span>
            <ScalarIcon
              icon="Clipboard"
              size="xs"
              class="text-c-3 group-hover:text-c-1 ml-auto min-h-3 min-w-3" />
          </button>
        </div>
      </div>
    </template>
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

.property-heading:has(+ .children),
.property-heading:has(+ .property-rule) {
  margin-bottom: 9px;
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

.deprecated {
  text-decoration: line-through;
}

.property-example {
  display: flex;
  flex-direction: column;
  font-size: var(--scalar-micro);
  position: relative;
}
.property-example:hover:before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 20px;
  border-radius: var(--scalar-radius);
}
.property-example:hover .property-example-label span {
  color: var(--scalar-color-1);
}
.property-example-label span {
  color: var(--scalar-color-3);
  position: relative;
  border-bottom: var(--scalar-border-width) dotted currentColor;
}
.property-example-value {
  font-family: var(--scalar-font-code);
  display: flex;
  align-items: center;
  width: 100%;
  padding: 6px;
}
.property-example-value span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.property-example-value :deep(svg) {
  color: var(--scalar-color-3);
}

.property-example-value:hover :deep(svg) {
  color: var(--scalar-color-1);
}

.property--compact .property-example {
  background: transparent;
}

.property--compact .property-example-value {
  background: var(--scalar-background-2);
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-radius: var(--scalar-radius);
}
.property-example-value-list {
  position: absolute;
  z-index: 1;
  top: 18px;
  left: 50%;
  transform: translate3d(-50%, 0, 0);
  overflow: auto;
  background-color: var(--scalar-background-1);
  box-shadow: var(--scalar-shadow-1);
  border-radius: var(--scalar-radius-lg);
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  padding: 9px;
  min-width: 200px;
  max-width: 300px;
  flex-direction: column;
  gap: 3px;
  display: none;
  z-index: 10;
}
.property-example:hover .property-example-value-list,
.property-example:focus-within .property-example-value-list {
  display: flex;
}
</style>
