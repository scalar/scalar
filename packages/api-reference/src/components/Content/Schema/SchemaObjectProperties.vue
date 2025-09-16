<script setup lang="ts">
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  DiscriminatorObject,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { isTypeObject } from '@/components/Content/Schema/helpers/is-type-object'

import SchemaProperty from './SchemaProperty.vue'

const {
  schema,
  discriminator,
  hideReadOnly,
  hideWriteOnly,
  orderSchemaPropertiesBy = 'alpha',
  orderRequiredPropertiesFirst = true,
} = defineProps<{
  schema: SchemaObject
  discriminator?: DiscriminatorObject
  compact?: boolean
  hideHeading?: boolean
  level?: number
  hideModelNames?: boolean
  /** Hide readonly properties */
  hideReadOnly?: boolean
  /** Hide write-only properties */
  hideWriteOnly?: boolean
  breadcrumb?: string[]
  orderSchemaPropertiesBy?: ApiReferenceConfiguration['orderSchemaPropertiesBy']
  orderRequiredPropertiesFirst?: ApiReferenceConfiguration['orderRequiredPropertiesFirst']
}>()

/**
 * Sorts properties by required status first, then alphabetically.
 * Required properties appear first, followed by optional properties.
 */
const sortedProperties = computed(() => {
  if (!isTypeObject(schema) || !schema.properties) {
    return []
  }

  const propertyNames = Object.keys(schema.properties)
  const requiredPropertiesSet = new Set(schema.required || [])

  return propertyNames
    .sort((a, b) => {
      const aDiscriminator = a === discriminator?.propertyName
      const bDiscriminator = b === discriminator?.propertyName

      const aRequired = requiredPropertiesSet.has(a)
      const bRequired = requiredPropertiesSet.has(b)

      // Discriminator comes first always
      if (aDiscriminator && !bDiscriminator) {
        return -1
      }
      if (!aDiscriminator && bDiscriminator) {
        return 1
      }

      // Order required properties first
      if (orderRequiredPropertiesFirst) {
        // If one is required and the other isn't, required comes first
        if (aRequired && !bRequired) {
          return -1
        }
        if (!aRequired && bRequired) {
          return 1
        }
      }

      // If both have the same required status, sort alphabetically
      if (orderSchemaPropertiesBy === 'alpha') {
        return a.localeCompare(b)
      }

      return 0
    })
    .filter((property) => {
      // If hideReadOnly is true, filter out properties that are readOnly
      if (hideReadOnly) {
        return !(
          schema.properties &&
          getResolvedRef(schema.properties[property])?.readOnly === true
        )
      }
      // If hideWriteOnly is true, filter out properties that are writeOnly
      if (hideWriteOnly) {
        return !(
          schema.properties &&
          getResolvedRef(schema.properties[property])?.writeOnly === true
        )
      }
      return true
    })
})

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
    return `${additionalProperties['x-additionalPropertiesName'].trim()}*`
  }

  return 'propertyName*'
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
      :hideHeading
      :hideModelNames
      :hideReadOnly="hideReadOnly"
      :hideWriteOnly="hideWriteOnly"
      :level
      :name="property"
      :required="schema.required?.includes(property)"
      :value="getResolvedRef(schema.properties[property])" />
  </template>

  <!-- patternProperties -->
  <template v-if="isTypeObject(schema) && schema.patternProperties">
    <SchemaProperty
      v-for="[key, property] in Object.entries(schema.patternProperties)"
      :key="key"
      :breadcrumb
      :compact
      :discriminator
      :hideHeading
      :hideModelNames="hideModelNames"
      :hideReadOnly="hideReadOnly"
      :hideWriteOnly="hideWriteOnly"
      :level
      :name="key"
      :value="getResolvedRef(property)" />
  </template>

  <!-- additionalProperties -->
  <template v-if="isTypeObject(schema) && schema.additionalProperties">
    <SchemaProperty
      :breadcrumb
      :compact
      :discriminator
      :hideHeading
      :hideModelNames
      :hideReadOnly="hideReadOnly"
      :hideWriteOnly="hideWriteOnly"
      :level
      :name="getAdditionalPropertiesName(schema.additionalProperties)"
      noncollapsible
      :value="getAdditionalPropertiesValue(schema.additionalProperties)"
      variant="additionalProperties" />
  </template>
</template>
