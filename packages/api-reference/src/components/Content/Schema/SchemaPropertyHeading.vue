<script lang="ts" setup>
import { isDefined } from '@scalar/helpers/array/is-defined'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { resolve } from '@scalar/workspace-store/resolve'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import {
  isArraySchema,
  isNumberSchema,
  isStringSchema,
} from '@scalar/workspace-store/schemas/v3.1/strict/type-guards'
import { computed, toRef } from 'vue'

import { Badge } from '@/components/Badge'
import LinkButton from '@/components/Content/Schema/LinkButton.vue'
import ScreenReader from '@/components/ScreenReader.vue'
import { useApiReferenceI18n } from '@/features/i18n'

import { getSchemaType } from './helpers/get-schema-type'
import { getModelNameFromSchema } from './helpers/schema-name'
import RenderString from './RenderString.vue'
import SchemaPropertyDefault from './SchemaPropertyDefault.vue'
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
    /** When the schema was resolved from a $ref, pass the ref name so it displays as e.g. "Data" instead of "object". */
    modelName?: string | null
    /** Resolved propertyNames schema, used to surface key constraints like `format` for additional properties. */
    propertyNames?: SchemaObject
    eventBus?: WorkspaceEventBus | null
  }>(),
  {
    isDiscriminator: false,
    required: false,
    withExamples: true,
    hideModelNames: false,
    eventBus: null,
  },
)
const { translate } = useApiReferenceI18n()

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
    const items = resolve.schema(schema.items)

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
        value: `${translate('common.unique')}!`,
      })
    }
  }

  // String length properties
  if (isStringSchema(schema)) {
    if (schema.minLength) {
      properties.push({
        key: 'min-length',
        prefix: `${translate('common.minLength')}: `,
        value: schema.minLength,
      })
    }

    if (schema.maxLength) {
      properties.push({
        key: 'max-length',
        prefix: `${translate('common.maxLength')}: `,
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
        prefix: `${translate('common.greaterThan')}: `,
        value: schema.exclusiveMinimum,
      })
    }

    if (isDefined(schema.minimum)) {
      properties.push({
        key: 'minimum',
        prefix: `${translate('common.min')}: `,
        value: schema.minimum,
      })
    }

    if (isDefined(schema.exclusiveMaximum)) {
      properties.push({
        key: 'exclusive-maximum',
        prefix: `${translate('common.lessThan')}: `,
        value: schema.exclusiveMaximum,
      })
    }

    if (isDefined(schema.maximum)) {
      properties.push({
        key: 'maximum',
        prefix: `${translate('common.max')}: `,
        value: schema.maximum,
      })
    }

    if (isDefined(schema.multipleOf)) {
      properties.push({
        key: 'multiple-of',
        prefix: `${translate('common.multipleOf')}: `,
        value: schema.multipleOf,
      })
    }
  }

  return properties
})

/** Link data for navigating to the referenced model in the sidebar. */
const modelLink = computed(() => {
  if (!props.value) {
    return null
  }

  if (props.hideModelNames) {
    return null
  }

  if (props.modelName) {
    return { schemaKey: props.modelName, label: props.modelName }
  }

  const modelName = getModelNameFromSchema(props.value)
  if (modelName) {
    return { schemaKey: modelName.schemaKey, label: modelName.label }
  }

  if (isArraySchema(props.value) && props.value.items) {
    const itemName = getModelNameFromSchema(props.value.items)
    return itemName
      ? { schemaKey: itemName.schemaKey, label: `${itemName.label}[]` }
      : null
  }

  return null
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
  return getSchemaType(props.value)
})

/**
 * Type and format of the property keys, derived from the propertyNames schema.
 *
 * For a map keyed by UUIDs this renders e.g. "string · uuid" so the key
 * constraints are not lost. Returns undefined when there is nothing to show.
 */
const propertyNamesDetail = computed(() => {
  const schema = props.propertyNames
  if (!schema) {
    return undefined
  }

  const parts = [getSchemaType(schema)]
  if ('format' in schema && typeof schema.format === 'string') {
    parts.push(schema.format)
  }

  const detail = parts.filter(Boolean).join(' · ')
  return detail.length > 0 ? detail : undefined
})

const exampleValue = computed(() => {
  // Treat only `undefined` as "not set" — `null` is a valid example value on a nullable schema.
  if (
    props.value &&
    'example' in props.value &&
    props.value.example !== undefined
  ) {
    return props.value.example
  }

  if (props.value && isArraySchema(props.value)) {
    const itemsSchema = resolve.schema(props.value.items)
    if (
      itemsSchema &&
      'example' in itemsSchema &&
      itemsSchema.example !== undefined
    ) {
      return itemsSchema.example
    }
  }

  return undefined
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
      {{ translate('common.discriminator') }}
    </div>
    <template v-if="props.value">
      <!-- Type information -->
      <SchemaPropertyDetail
        v-if="shouldShowType"
        truncate>
        <ScreenReader>{{ translate('common.type') }}: </ScreenReader
        >{{ displayType
        }}<template v-if="modelLink">
          ·
          <LinkButton
            v-if="props.eventBus && modelLink.schemaKey"
            @click="
              props.eventBus.emit('scroll-to:model-by-name', {
                name: modelLink.schemaKey,
              })
            ">
            {{ modelLink.label }}
          </LinkButton>
          <template v-else>{{ modelLink.label }}</template>
        </template>
      </SchemaPropertyDetail>

      <!-- Key constraints from propertyNames (e.g. "keys: string · uuid") -->
      <SchemaPropertyDetail
        v-if="propertyNamesDetail"
        truncate>
        <template #prefix>{{ translate('common.keys') }}:</template>
        {{ propertyNamesDetail }}
      </SchemaPropertyDetail>

      <!-- Dynamic validation properties from composable -->
      <SchemaPropertyDetail
        v-for="property in validationProperties"
        :key="property.key"
        :code="property.code"
        :truncate="property.truncate">
        <ScreenReader v-if="property.key === 'format'">
          {{ translate('common.format') }}:
        </ScreenReader>
        <ScreenReader v-else-if="property.key === 'pattern'">
          {{ translate('common.pattern') }}:
        </ScreenReader>
        <template
          v-if="property.prefix"
          #prefix>
          {{ property.prefix }}
        </template>
        {{ property.value }}
      </SchemaPropertyDetail>

      <!-- Enum indicator -->
      <SchemaPropertyDetail v-if="props.enum">
        {{ translate('common.enum') }}
      </SchemaPropertyDetail>
    </template>
    <div
      v-if="props.additional"
      class="property-additional">
      <template v-if="props.value?.['x-additionalPropertiesName']">
        {{ props.value['x-additionalPropertiesName'] }}
      </template>
      <template v-else>{{ translate('common.additionalProperties') }}</template>
    </div>
    <div
      v-if="props.value?.deprecated"
      class="property-deprecated">
      <Badge>{{ translate('common.deprecated') }}</Badge>
    </div>
    <!-- Don't use `isDefined` here, we want to show `const` when the value is `null` -->
    <div
      v-if="constValue !== undefined"
      class="property-const">
      <SchemaPropertyDetail truncate>
        <template #prefix>{{ translate('common.const') }}: </template>
        <RenderString :value="constValue" />
      </SchemaPropertyDetail>
    </div>
    <template v-else>
      <!-- Shows only when a composition is used (so props.value?.type is undefined) -->
      <SchemaPropertyDetail v-if="(props.value as any)?.nullable === true">
        {{ translate('common.nullable') }}
      </SchemaPropertyDetail>
    </template>
    <div
      v-if="props.value?.writeOnly"
      class="property-write-only">
      {{ translate('common.writeOnly') }}
    </div>
    <div
      v-else-if="props.value?.readOnly"
      class="property-read-only">
      {{ translate('common.readOnly') }}
    </div>
    <div
      v-if="props.required"
      class="property-required">
      {{ translate('common.required') }}
    </div>
    <SchemaPropertyDefault :value="props.value?.default" />
    <SchemaPropertyExamples
      v-if="props.withExamples"
      :example="exampleValue"
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
  max-width: 100%;
  font-family: var(--scalar-font-code);
  font-weight: var(--scalar-bold);
  font-size: var(--scalar-font-size-4);
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
