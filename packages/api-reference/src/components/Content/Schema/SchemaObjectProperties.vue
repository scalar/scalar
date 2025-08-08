<script setup lang="ts">
import type { DiscriminatorObject } from '@scalar/workspace-store/schemas/v3.1/strict/discriminator'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/schema'
import { computed } from 'vue'

import SchemaProperty from './SchemaProperty.vue'

const { schema, discriminator } = defineProps<{
  schema: SchemaObject
  discriminator?: DiscriminatorObject
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
    const aDiscriminator = a === discriminator?.propertyName
    const bDiscriminator = b === discriminator?.propertyName
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
  additionalProperties: SchemaObject['additionalProperties'],
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
  additionalProperties: SchemaObject['additionalProperties'],
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
      :breadcrumb
      :compact
      :discriminator
      :hideHeading
      :level
      :name="property"
      :hideModelNames
      :required="schema.required?.includes(property)"
      :value="schema.properties[property]" />
  </template>

  <!-- patternProperties -->
  <template v-if="schema.patternProperties">
    <SchemaProperty
      v-for="property in Object.keys(schema.patternProperties)"
      :key="property"
      :breadcrumb
      :compact
      :discriminator
      :hideHeading
      :level
      :name="property"
      :hideModelNames="hideModelNames"
      :value="schema.patternProperties[property]" />
  </template>

  <!-- additionalProperties -->
  <template v-if="schema.additionalProperties">
    <SchemaProperty
      variant="additionalProperties"
      :breadcrumb
      :compact
      :discriminator
      :hideHeading
      :level
      :name="getAdditionalPropertiesName(schema.additionalProperties)"
      :hideModelNames
      :value="getAdditionalPropertiesValue(schema.additionalProperties)"
      noncollapsible />
  </template>
</template>
