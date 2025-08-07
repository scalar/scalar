<script lang="ts" setup>
import { isDefined } from '@scalar/helpers/array/is-defined'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/schema'
import { computed } from 'vue'

import { Badge } from '@/components/Badge'
import ScreenReader from '@/components/ScreenReader.vue'

import { getSchemaType } from './helpers/get-schema-type'
import { getModelName } from './helpers/schema-name'
import RenderString from './RenderString.vue'
import SchemaPropertyDetail from './SchemaPropertyDetail.vue'
import SchemaPropertyExamples from './SchemaPropertyExamples.vue'

const {
  value,
  isDiscriminator = false,
  required = false,
  withExamples = true,
  hideModelNames = false,
} = defineProps<{
  value?: SchemaObject
  enum?: boolean
  isDiscriminator?: boolean
  required?: boolean
  additional?: boolean
  withExamples?: boolean
  hideModelNames?: boolean
}>()

const flattenDefaultValue = (value: SchemaObject) => {
  if (value?.default === null) {
    return 'null'
  }

  if (Array.isArray(value?.default) && value.default.length === 1) {
    return value.default[0]
  }

  if (typeof value?.default === 'string') {
    return JSON.stringify(value.default)
  }

  if (Array.isArray(value?.default)) {
    return JSON.stringify(value.default)
  }

  return value?.default
}

const constValue = computed(() => {
  if (value?.const !== undefined) {
    return value?.const
  }

  if (value?.enum?.length === 1) {
    return value.enum[0]
  }

  if (value?.items) {
    if (isDefined(value.items.const)) {
      return value.items.const
    }

    if (value.items.enum?.length === 1) {
      return value.items.enum[0]
    }
  }

  return undefined
})

/** Gets the model name */
const modelName = computed(() => {
  if (!value) {
    return null
  }

  return getModelName(value, hideModelNames)
})
</script>
<template>
  <div class="property-heading">
    <div
      v-if="$slots.name"
      class="property-name"
      :class="{ deprecated: value?.deprecated }">
      <slot name="name" />
    </div>
    <div
      v-if="isDiscriminator"
      class="property-discriminator">
      Discriminator
    </div>
    <template v-if="value">
      <SchemaPropertyDetail
        v-if="value?.type"
        truncate>
        <ScreenReader>Type: </ScreenReader>
        <template v-if="modelName">{{ modelName }}</template>
        <template v-else>
          {{ getSchemaType(value) }}
        </template>
      </SchemaPropertyDetail>
      <SchemaPropertyDetail v-if="value.minItems || value.maxItems">
        {{ value.minItems }}&hellip;{{ value.maxItems }}
      </SchemaPropertyDetail>
      <SchemaPropertyDetail v-if="value.minLength">
        <template #prefix>min length: </template>
        {{ value.minLength }}
      </SchemaPropertyDetail>
      <SchemaPropertyDetail v-if="value.maxLength">
        <template #prefix>max length: </template>
        {{ value.maxLength }}
      </SchemaPropertyDetail>
      <SchemaPropertyDetail v-if="value.uniqueItems">
        unique!
      </SchemaPropertyDetail>
      <SchemaPropertyDetail
        v-if="value.format"
        truncate>
        <ScreenReader>Format:</ScreenReader>
        {{ value.format }}
      </SchemaPropertyDetail>
      <SchemaPropertyDetail v-if="isDefined(value.exclusiveMinimum)">
        <template #prefix>greater than: </template>
        {{ value.exclusiveMinimum }}
      </SchemaPropertyDetail>
      <SchemaPropertyDetail v-if="isDefined(value.minimum)">
        <template #prefix>min: </template>
        {{ value.minimum }}
      </SchemaPropertyDetail>
      <SchemaPropertyDetail v-if="isDefined(value.exclusiveMaximum)">
        <template #prefix>less than: </template>
        {{ value.exclusiveMaximum }}
      </SchemaPropertyDetail>
      <SchemaPropertyDetail v-if="isDefined(value.maximum)">
        <template #prefix>max: </template>
        {{ value.maximum }}
      </SchemaPropertyDetail>
      <SchemaPropertyDetail v-if="isDefined(value.multipleOf)">
        <template #prefix>multiple of: </template>
        {{ value.multipleOf }}
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
        <template #prefix>default: </template>
        {{ flattenDefaultValue(value) }}
      </SchemaPropertyDetail>
    </template>
    <div
      v-if="additional"
      class="property-additional">
      <template v-if="value?.['x-additionalPropertiesName']">
        {{ value['x-additionalPropertiesName'] }}
      </template>
      <template v-else>additional properties</template>
    </div>
    <div
      v-if="value?.deprecated"
      class="property-deprecated">
      <Badge>deprecated</Badge>
    </div>
    <!-- Don't use `isDefined` here, we want to show `const` when the value is `null` -->
    <div
      v-if="constValue !== undefined"
      class="property-const">
      <SchemaPropertyDetail truncate>
        <template #prefix>const: </template>
        <RenderString :value="constValue" />
      </SchemaPropertyDetail>
    </div>
    <template v-else>
      <!-- Shows only when a composition is used (so value?.type is undefined) -->
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
    <!-- examples -->
    <SchemaPropertyExamples
      v-if="withExamples"
      :examples="value?.examples"
      :example="value?.example || value?.items?.example" />
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
  white-space: normal;
  overflow-wrap: break-word;
}

.property-additional {
  font-family: var(--scalar-font-code);
}

.property-required,
.property-optional {
  color: var(--scalar-color-2);
}

.property-required {
  font-size: var(--scalar-mini);
  color: var(--scalar-color-orange);
}

.property-read-only {
  font-size: var(--scalar-mini);
  color: var(--scalar-color-blue);
}

.property-write-only {
  font-size: var(--scalar-mini);
  color: var(--scalar-color-green);
}

.property-discriminator {
  font-size: var(--scalar-mini);
  color: var(--scalar-color-purple);
}

.property-detail {
  font-size: var(--scalar-mini);
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
</style>
