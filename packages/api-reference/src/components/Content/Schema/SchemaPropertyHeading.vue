<script lang="ts" setup>
import { isDefined } from '@scalar/helpers/array/is-defined'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import {
  isArraySchema,
  isNumberSchema,
  isStringSchema,
} from '@scalar/workspace-store/schemas/v3.1/strict/type-guards'
import { computed, toRef } from 'vue'

import { Badge } from '@/components/Badge'
import ScreenReader from '@/components/ScreenReader.vue'

import { getSchemaType } from './helpers/get-schema-type'
import { getModelName } from './helpers/schema-name'
import RenderString from './RenderString.vue'
import SchemaPropertyDetail from './SchemaPropertyDetail.vue'
import SchemaPropertyExamples from './SchemaPropertyExamples.vue'

const props = withDefaults(
  defineProps<{
    value: SchemaObject | undefined
    enum?: boolean
    isDiscriminator?: boolean
    required?: boolean
    additional?: boolean
    withExamples?: boolean
    hideModelNames?: boolean
  }>(),
  {
    isDiscriminator: false,
    required: false,
    withExamples: true,
    hideModelNames: false,
  },
)

// Convert to reactive refs for composables
const valueRef = toRef(props, 'value')

const constValue = computed(() => {
  if (!valueRef.value) {
    return undefined
  }

  const schema = valueRef.value

  // Direct const value
  if (schema.const !== undefined) {
    return schema.const
  }

  // Single-item enum acts as const
  if (schema.enum?.length === 1) {
    return schema.enum[0]
  }

  // Check items for const values (for arrays)
  if (isArraySchema(schema) && schema.items) {
    const items = getResolvedRef(schema.items)

    if (isDefined(items.const)) {
      return items.const
    }

    if (items.enum?.length === 1) {
      return items.enum[0]
    }
  }

  return undefined
})

const validationProperties = computed(() => {
  if (!valueRef.value) {
    return []
  }

  const schema = valueRef.value
  const properties = []

  // Array validation properties
  if (isArraySchema(schema)) {
    if (schema.minItems || schema.maxItems) {
      properties.push({
        key: 'array-range',
        value: `${schema.minItems || ''}…${schema.maxItems || ''}`,
      })
    }

    // Unique items
    if (schema.uniqueItems) {
      properties.push({
        key: 'unique-items',
        value: 'unique!',
      })
    }
  }

  // String length properties
  if (isStringSchema(schema)) {
    if (schema.minLength) {
      properties.push({
        key: 'min-length',
        prefix: 'min length: ',
        value: schema.minLength,
      })
    }

    if (schema.maxLength) {
      properties.push({
        key: 'max-length',
        prefix: 'max length: ',
        value: schema.maxLength,
      })
    }

    // Pattern
    if (schema.pattern) {
      properties.push({
        key: 'pattern',
        value: schema.pattern,
        code: true,
        truncate: true,
      })
    }
  }

  // Format
  if (isStringSchema(schema) || isNumberSchema(schema)) {
    if (schema.format) {
      properties.push({
        key: 'format',
        value: schema.format,
        truncate: true,
      })
    }
  }

  // Numeric validation properties
  if (isNumberSchema(schema)) {
    if (isDefined(schema.exclusiveMinimum)) {
      properties.push({
        key: 'exclusive-minimum',
        prefix: 'greater than: ',
        value: schema.exclusiveMinimum,
      })
    }

    if (isDefined(schema.minimum)) {
      properties.push({
        key: 'minimum',
        prefix: 'min: ',
        value: schema.minimum,
      })
    }

    if (isDefined(schema.exclusiveMaximum)) {
      properties.push({
        key: 'exclusive-maximum',
        prefix: 'less than: ',
        value: schema.exclusiveMaximum,
      })
    }

    if (isDefined(schema.maximum)) {
      properties.push({
        key: 'maximum',
        prefix: 'max: ',
        value: schema.maximum,
      })
    }

    if (isDefined(schema.multipleOf)) {
      properties.push({
        key: 'multiple-of',
        prefix: 'multiple of: ',
        value: schema.multipleOf,
      })
    }
  }

  return properties
})

/** Gets the model name */
const modelName = computed(() => {
  if (!props.value) {
    return null
  }

  return getModelName(props.value, props.hideModelNames)
})

/** Check if we should show the type information */
const shouldShowType = computed(() => {
  if (!props.value || !('type' in props.value)) {
    return false
  }

  // Always show type for arrays, even when items have const values
  if (props.value.type === 'array') {
    return true
  }

  // For non-arrays, only show if no const value at the schema level
  return !constValue.value
})

/** Get the display type */
const displayType = computed(() => {
  if (!props.value) {
    return ''
  }
  return modelName.value || getSchemaType(props.value)
})

/**
 * Flattens default values for display purposes.
 */
const flattenedDefaultValue = computed(() => {
  const value = props.value

  if (value?.default === null) {
    return 'null'
  }

  if (Array.isArray(value?.default) && value?.default.length === 1) {
    return String(value?.default[0])
  }

  if (typeof value?.default === 'string') {
    return JSON.stringify(value.default)
  }

  if (Array.isArray(value?.default)) {
    return JSON.stringify(value?.default)
  }

  if (typeof value?.default === 'object') {
    return JSON.stringify(value?.default)
  }

  return value?.default
})
</script>
<template>
  <div class="property-heading">
    <div
      v-if="$slots.name"
      class="property-name"
      :class="{ deprecated: props.value?.deprecated }">
      <slot name="name" />
    </div>
    <div
      v-if="props.isDiscriminator"
      class="property-discriminator">
      Discriminator
    </div>
    <template v-if="props.value">
      <!-- Type information -->
      <SchemaPropertyDetail
        v-if="shouldShowType"
        truncate>
        <ScreenReader>Type: </ScreenReader>{{ displayType }}
      </SchemaPropertyDetail>

      <!-- Dynamic validation properties from composable -->
      <SchemaPropertyDetail
        v-for="property in validationProperties"
        :key="property.key"
        :code="property.code"
        :truncate="property.truncate">
        <ScreenReader v-if="property.key === 'format'">Format:</ScreenReader>
        <ScreenReader v-else-if="property.key === 'pattern'">
          Pattern:
        </ScreenReader>
        <template
          v-if="property.prefix"
          #prefix>
          {{ property.prefix }}
        </template>
        {{ property.value }}
      </SchemaPropertyDetail>

      <!-- Enum indicator -->
      <SchemaPropertyDetail v-if="props.enum">enum</SchemaPropertyDetail>

      <!-- Default value -->
      <SchemaPropertyDetail
        v-if="flattenedDefaultValue !== undefined"
        truncate>
        <template #prefix>default:</template>{{ flattenedDefaultValue }}
      </SchemaPropertyDetail>
    </template>
    <div
      v-if="props.additional"
      class="property-additional">
      <template v-if="props.value?.['x-additionalPropertiesName']">
        {{ props.value['x-additionalPropertiesName'] }}
      </template>
      <template v-else>additional properties</template>
    </div>
    <div
      v-if="props.value?.deprecated"
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
      <!-- Shows only when a composition is used (so props.value?.type is undefined) -->
      <SchemaPropertyDetail v-if="(props.value as any)?.nullable === true">
        nullable
      </SchemaPropertyDetail>
    </template>
    <div
      v-if="props.value?.writeOnly"
      class="property-write-only">
      write-only
    </div>
    <div
      v-else-if="props.value?.readOnly"
      class="property-read-only">
      read-only
    </div>
    <div
      v-if="props.required"
      class="property-required">
      required
    </div>
    <!-- examples -->
    <SchemaPropertyExamples
      v-if="props.withExamples"
      :example="
        props.value?.example ||
        (props.value &&
          isArraySchema(props.value) &&
          getResolvedRef(props.value?.items)?.example)
      "
      :examples="props.value?.examples" />
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
