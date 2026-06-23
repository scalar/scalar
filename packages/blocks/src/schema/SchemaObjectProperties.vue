<script setup lang="ts">
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { resolve } from '@scalar/workspace-store/resolve'
import type {
  DiscriminatorObject,
  SchemaObject,
  SchemaReferenceType,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { isTypeObject } from '@/components/Content/Schema/helpers/is-type-object'
import { getCycleKey } from '@/components/Content/Schema/helpers/schema-cycle'
import { sortPropertyNames } from '@/components/Content/Schema/helpers/sort-property-names'
import type { SchemaOptions } from '@/components/Content/Schema/types'

import SchemaProperty from './SchemaProperty.vue'

const { schema, discriminator, options, schemaContext, compositionPath } =
  defineProps<{
    schema: SchemaObject
    discriminator?: DiscriminatorObject
    compact?: boolean
    hideHeading?: boolean
    level?: number
    hideModelNames?: boolean
    breadcrumb?: string[]
    eventBus: WorkspaceEventBus | null
    options: SchemaOptions
    schemaContext?: string
    compositionPath?: string[]
  }>()

/**
 * Sorts properties by required status first, then alphabetically.
 * Required properties appear first, followed by optional properties.
 */
const sortedProperties = computed(() =>
  sortPropertyNames(schema, discriminator, options),
)

/**
 * Get the display name for additional properties.
 *
 * Checks x-additionalPropertiesName extension first, then falls back to the
 * propertyNames schema title if available.
 */
const getAdditionalPropertiesName = (
  _additionalProperties: Extract<
    SchemaObject,
    { type: 'object' }
  >['additionalProperties'],
  _propertyNames?: Extract<SchemaObject, { type: 'object' }>['propertyNames'],
) => {
  const additionalProperties =
    typeof _additionalProperties === 'boolean'
      ? _additionalProperties
      : resolve.schema(_additionalProperties)

  if (
    typeof additionalProperties === 'object' &&
    typeof additionalProperties['x-additionalPropertiesName'] === 'string' &&
    additionalProperties['x-additionalPropertiesName'].trim().length > 0
  ) {
    return `${additionalProperties['x-additionalPropertiesName'].trim()}`
  }

  // Fall back to the propertyNames title when available
  if (_propertyNames) {
    const resolved = resolve.schema(_propertyNames)
    if (resolved?.title) {
      return resolved.title
    }
  }

  return 'propertyName'
}

/**
 * Extract enum values from the propertyNames schema.
 *
 * JSON Schema's propertyNames keyword constrains which keys are valid
 * in an object with additionalProperties. When it contains an enum,
 * these are the allowed key names.
 */
const getPropertyNamesEnum = (
  _propertyNames?: Extract<SchemaObject, { type: 'object' }>['propertyNames'],
): string[] | undefined => {
  if (!_propertyNames) {
    return undefined
  }

  const resolved = resolve.schema(_propertyNames)
  if (
    resolved &&
    'enum' in resolved &&
    Array.isArray(resolved.enum) &&
    resolved.enum.length > 0
  ) {
    return resolved.enum as string[]
  }

  return undefined
}

/** Enum values for the property keys, derived from propertyNames if present. */
const additionalPropertiesEnum = computed(() => {
  if (!isTypeObject(schema) || !schema.additionalProperties) {
    return undefined
  }
  return getPropertyNamesEnum(schema.propertyNames)
})

/**
 * The resolved propertyNames schema for the property keys.
 *
 * Surfaces key constraints such as `format` (for example `uuid`) so they are
 * not lost when rendering a map of additional properties.
 */
const additionalPropertiesKeySchema = computed(() => {
  if (!isTypeObject(schema) || !schema.additionalProperties) {
    return undefined
  }
  return schema.propertyNames ? resolve.schema(schema.propertyNames) : undefined
})

/**
 * Keep sibling property descriptions separate from the referenced schema.
 *
 * This allows us to render both:
 * - the property-specific description written next to the $ref, and
 * - the referenced schema's own description (for example discriminator parent docs)
 */
const getPropertySchema = (
  property: SchemaReferenceType<SchemaObject> | undefined,
): SchemaObject | undefined => {
  if (!property) {
    return undefined
  }
  return resolve.schema(property)
}

const getPropertyDescription = (
  property: SchemaReferenceType<SchemaObject> | undefined,
): string | undefined => {
  if (!property) {
    return undefined
  }

  return typeof property.description === 'string'
    ? property.description
    : undefined
}

/**
 * Get the value for additional properties.
 *
 * When additionalProperties is true or an empty object, it should render as { type: 'anything' }.
 * $ref values are resolved before the type check so the referenced schema is rendered correctly.
 */
const getAdditionalPropertiesValue = (
  additionalProperties: Extract<
    SchemaObject,
    { type: 'object' }
  >['additionalProperties'],
): SchemaObject => {
  // Resolve $ref first so the type check below works on the actual schema
  const resolved =
    typeof additionalProperties === 'boolean'
      ? additionalProperties
      : resolve.schema(additionalProperties)

  if (
    resolved === true ||
    (typeof resolved === 'object' && Object.keys(resolved).length === 0) ||
    typeof resolved !== 'object' ||
    !('type' in resolved)
  ) {
    return {
      // @ts-expect-error - ask hans
      type: 'anything',
      ...(typeof resolved === 'object' ? resolved : {}),
    }
  }

  return resolved
}
</script>

<template>
  <!-- Properties -->
  <template v-if="isTypeObject(schema) && schema.properties">
    <SchemaProperty
      v-for="property in sortedProperties"
      :key="property"
      :breadcrumb
      :compact
      :compositionPath="compositionPath"
      :compositionPathSegment="property"
      :cycleKey="getCycleKey(schema.properties[property])"
      :description="getPropertyDescription(schema.properties[property])"
      :discriminator
      :eventBus="eventBus"
      :hideHeading
      :hideModelNames
      :level
      :name="property"
      :options="options"
      :required="schema.required?.includes(property)"
      :schema="getPropertySchema(schema.properties[property])"
      :schemaContext="schemaContext" />
  </template>

  <!-- patternProperties -->
  <template v-if="isTypeObject(schema) && schema.patternProperties">
    <SchemaProperty
      v-for="[key, property] in Object.entries(schema.patternProperties)"
      :key="key"
      :breadcrumb
      :compact
      :compositionPath="compositionPath"
      :compositionPathSegment="key"
      :cycleKey="getCycleKey(property)"
      :description="getPropertyDescription(property)"
      :discriminator
      :eventBus="eventBus"
      :hideHeading
      :hideModelNames="hideModelNames"
      :level
      :name="key"
      :options="options"
      :schema="getPropertySchema(property)"
      :schemaContext="schemaContext" />
  </template>

  <!-- additionalProperties -->
  <template v-if="isTypeObject(schema) && schema.additionalProperties">
    <SchemaProperty
      :breadcrumb
      :compact
      :compositionPath="compositionPath"
      :compositionPathSegment="
        getAdditionalPropertiesName(
          schema.additionalProperties,
          schema.propertyNames,
        )
      "
      :cycleKey="getCycleKey(schema.additionalProperties)"
      :discriminator
      :eventBus="eventBus"
      :hideHeading
      :hideModelNames
      :level
      :name="
        getAdditionalPropertiesName(
          schema.additionalProperties,
          schema.propertyNames,
        )
      "
      noncollapsible
      :options="options"
      :propertyNamesEnum="additionalPropertiesEnum"
      :propertyNamesSchema="additionalPropertiesKeySchema"
      :schema="getAdditionalPropertiesValue(schema.additionalProperties)"
      :schemaContext="schemaContext"
      variant="additionalProperties" />
  </template>
</template>
