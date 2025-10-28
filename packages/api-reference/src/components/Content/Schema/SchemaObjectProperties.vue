<script setup lang="ts">
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  DiscriminatorObject,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { isTypeObject } from '@/components/Content/Schema/helpers/is-type-object'
import { sortPropertyNames } from '@/components/Content/Schema/helpers/sort-property-names'
import type { SchemaOptions } from '@/components/Content/Schema/types'

import SchemaProperty from './SchemaProperty.vue'

const { schema, discriminator, options } = defineProps<{
  schema: SchemaObject
  discriminator?: DiscriminatorObject
  compact?: boolean
  hideHeading?: boolean
  level?: number
  hideModelNames?: boolean
  breadcrumb?: string[]
  eventBus: WorkspaceEventBus | null
  options: SchemaOptions
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
 * Uses x-additionalPropertiesName extension if available, otherwise falls back to a default name.
 */
const getAdditionalPropertiesName = (
  _additionalProperties: Extract<
    SchemaObject,
    { type: 'object' }
  >['additionalProperties'],
) => {
  const additionalProperties = getResolvedRef(_additionalProperties)

  if (
    typeof additionalProperties === 'object' &&
    typeof additionalProperties['x-additionalPropertiesName'] === 'string' &&
    additionalProperties['x-additionalPropertiesName'].trim().length > 0
  ) {
    return `${additionalProperties['x-additionalPropertiesName'].trim()}`
  }

  return 'propertyName'
}

/**
 * Get the value for additional properties.
 *
 * When additionalProperties is true or an empty object, it should render as { type: 'anything' }.
 */
const getAdditionalPropertiesValue = (
  additionalProperties: Extract<
    SchemaObject,
    { type: 'object' }
  >['additionalProperties'],
): SchemaObject => {
  if (
    additionalProperties === true ||
    (typeof additionalProperties === 'object' &&
      Object.keys(additionalProperties).length === 0) ||
    typeof additionalProperties !== 'object' ||
    !('type' in additionalProperties)
  ) {
    return {
      // @ts-expect-error - ask hans
      type: 'anything',
      ...(typeof additionalProperties === 'object' ? additionalProperties : {}),
    }
  }

  return additionalProperties
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
      :discriminator
      :eventBus="eventBus"
      :hideHeading
      :hideModelNames
      :level
      :name="property"
      :options="options"
      :required="schema.required?.includes(property)"
      :schema="getResolvedRef(schema.properties[property])" />
  </template>

  <!-- patternProperties -->
  <template v-if="isTypeObject(schema) && schema.patternProperties">
    <SchemaProperty
      v-for="[key, property] in Object.entries(schema.patternProperties)"
      :key="key"
      :breadcrumb
      :compact
      :discriminator
      :eventBus="eventBus"
      :hideHeading
      :hideModelNames="hideModelNames"
      :level
      :name="key"
      :options="options"
      :schema="getResolvedRef(property)" />
  </template>

  <!-- additionalProperties -->
  <template v-if="isTypeObject(schema) && schema.additionalProperties">
    <SchemaProperty
      :breadcrumb
      :compact
      :discriminator
      :eventBus="eventBus"
      :hideHeading
      :hideModelNames
      :level
      :name="getAdditionalPropertiesName(schema.additionalProperties)"
      noncollapsible
      :options="options"
      :schema="getAdditionalPropertiesValue(schema.additionalProperties)"
      variant="additionalProperties" />
  </template>
</template>
