<script setup lang="ts">
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import { computed } from 'vue'

import type { Schemas } from '@/features/Operation/types/schemas'

import SchemaProperty from './SchemaProperty.vue'

const {
  schema,
  orderSchemaPropertiesBy = 'alpha',
  orderRequiredPropertiesFirst = true,
} = defineProps<{
  schema: OpenAPIV3_1.SchemaObject
  compact?: boolean
  hideHeading?: boolean
  level?: number
  hideModelNames?: boolean
  schemas?: Schemas
  discriminator?: string
  discriminatorMapping?: Record<string, string>
  discriminatorPropertyName?: string
  orderSchemaPropertiesBy?: ApiReferenceConfiguration['orderSchemaPropertiesBy']
  orderRequiredPropertiesFirst?: ApiReferenceConfiguration['orderRequiredPropertiesFirst']
  hasDiscriminator?: boolean
  breadcrumb?: string[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
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
    const aRequired = requiredPropertiesSet.has(a)
    const bRequired = requiredPropertiesSet.has(b)

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
})

/**
 * Handles discriminator type changes from child SchemaProperty components.
 * Propagates the change up to the parent component.
 */
const handleDiscriminatorChange = (type: string) => {
  emit('update:modelValue', type)
}

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
      :discriminatorMapping="
        schema.discriminator?.mapping || discriminatorMapping
      "
      :discriminatorPropertyName="
        schema.discriminator?.propertyName || discriminatorPropertyName
      "
      :hideHeading="hideHeading"
      :hideModelNames="hideModelNames"
      :isDiscriminator="
        property ===
        (schema.discriminator?.propertyName || discriminatorPropertyName)
      "
      :level="level"
      :modelValue="discriminator"
      :name="property"
      :required="
        schema.required?.includes(property) ||
        schema.properties[property]?.required === true
      "
      :resolvedSchema="schema.properties[property]"
      :schemas="schemas"
      :value="{
        ...schema.properties[property],
        parent: schema,
        isDiscriminator:
          property === discriminatorPropertyName ||
          schema.discriminator?.propertyName === property,
      }"
      @update:modelValue="handleDiscriminatorChange" />
  </template>

  <!-- patternProperties -->
  <template v-if="schema.patternProperties">
    <SchemaProperty
      v-for="property in Object.keys(schema.patternProperties)"
      :key="property"
      :breadcrumb="breadcrumb"
      :compact="compact"
      :discriminatorMapping="discriminatorMapping"
      :discriminatorPropertyName="discriminatorPropertyName"
      :hideHeading="hideHeading"
      :hideModelNames="hideModelNames"
      :isDiscriminator="false"
      :level="level"
      :modelValue="discriminator"
      :name="property"
      :resolvedSchema="schema.patternProperties[property]"
      :schemas="schemas"
      :value="{
        ...schema.patternProperties[property],
      }"
      variant="patternProperties"
      @update:modelValue="handleDiscriminatorChange" />
  </template>

  <!-- additionalProperties -->
  <template v-if="schema.additionalProperties">
    <SchemaProperty
      :breadcrumb="breadcrumb"
      :compact="compact"
      :discriminatorMapping="discriminatorMapping"
      :discriminatorPropertyName="discriminatorPropertyName"
      :hideHeading="hideHeading"
      :hideModelNames="hideModelNames"
      :isDiscriminator="false"
      :level="level"
      :modelValue="discriminator"
      :name="getAdditionalPropertiesName(schema.additionalProperties)"
      noncollapsible
      :resolvedSchema="
        getAdditionalPropertiesValue(schema.additionalProperties)
      "
      :schemas="schemas"
      :value="getAdditionalPropertiesValue(schema.additionalProperties)"
      variant="additionalProperties"
      @update:modelValue="handleDiscriminatorChange" />
  </template>
</template>
