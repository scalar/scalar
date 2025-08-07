<script setup lang="ts">
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { computed } from 'vue'

import SchemaProperty from './SchemaProperty.vue'

const { schema } = defineProps<{
  schema: OpenAPIV3_1.SchemaObject
  compact?: boolean
  hideHeading?: boolean
  level?: number
  hideModelNames?: boolean
  breadcrumb?: string[]
}>()

/**
 * Sorts properties by required status first, then alphabetically.
 * Required properties appear first, followed by optional properties.
 */
const sortedProperties = computed(() => {
  if (!schema.properties) {
    return []
  }

  const propertyNames = Object.keys(schema.properties)
  const requiredPropertiesSet = new Set(schema.required || [])

  return propertyNames.sort((a, b) => {
    // TODO: fill this in
    const aDiscriminator = a === 'discriminatorPropertyName'
    const bDiscriminator = b === 'discriminatorPropertyName'
    const aRequired = requiredPropertiesSet.has(a)
    const bRequired = requiredPropertiesSet.has(b)

    // Discriminator comes first
    if (aDiscriminator && !bDiscriminator) {
      return -1
    }
    if (!aDiscriminator && bDiscriminator) {
      return 1
    }

    // If both are discriminator or both are not discriminator, sort by required status
    if (aRequired && !bRequired) {
      return -1
    }
    if (!aRequired && bRequired) {
      return 1
    }

    // If both have the same required status, sort alphabetically
    return a.localeCompare(b)
  })
})

/**
 * Get the display name for additional properties.
 *
 * Uses x-additionalPropertiesName extension if available, otherwise falls back to a default name.
 */
const getAdditionalPropertiesName = (
  additionalProperties: OpenAPIV3_1.SchemaObject | boolean,
) => {
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
  additionalProperties: OpenAPIV3_1.SchemaObject | boolean,
) => {
  if (
    additionalProperties === true ||
    (typeof additionalProperties === 'object' &&
      Object.keys(additionalProperties).length === 0) ||
    typeof additionalProperties !== 'object' ||
    !('type' in additionalProperties)
  ) {
    return {
      type: 'anything',
      ...(typeof additionalProperties === 'object' ? additionalProperties : {}),
    }
  }

  return additionalProperties
}
</script>

<template>
  <!-- Properties -->
  <template v-if="schema.properties">
    <SchemaProperty
      v-for="property in sortedProperties"
      :key="property"
      :breadcrumb="breadcrumb"
      :compact="compact"
      :hideHeading="hideHeading"
      :level="level"
      :name="property"
      :hideModelNames="hideModelNames"
      :required="
        schema.required?.includes(property) ||
        schema.properties[property]?.required === true
      "
      :resolvedSchema="schema.properties[property]"
      :value="schema.properties[property]" />
  </template>

  <!-- patternProperties -->
  <template v-if="schema.patternProperties">
    <SchemaProperty
      :breadcrumb="breadcrumb"
      v-for="property in Object.keys(schema.patternProperties)"
      :key="property"
      variant="patternProperties"
      :compact="compact"
      :hideHeading="hideHeading"
      :level="level"
      :name="property"
      :hideModelNames="hideModelNames"
      :resolvedSchema="schema.patternProperties[property]"
      :value="{
        ...schema.patternProperties[property],
      }" />
  </template>

  <!-- additionalProperties -->
  <template v-if="schema.additionalProperties">
    <SchemaProperty
      :breadcrumb="breadcrumb"
      variant="additionalProperties"
      :compact="compact"
      :hideHeading="hideHeading"
      :level="level"
      :name="getAdditionalPropertiesName(schema.additionalProperties)"
      :hideModelNames="hideModelNames"
      :resolvedSchema="
        getAdditionalPropertiesValue(schema.additionalProperties)
      "
      :value="getAdditionalPropertiesValue(schema.additionalProperties)"
      noncollapsible />
  </template>
</template>
