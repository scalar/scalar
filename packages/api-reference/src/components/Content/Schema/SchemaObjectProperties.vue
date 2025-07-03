<script setup lang="ts">
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import type { Schemas } from '@/features/Operation/types/schemas'

import SchemaProperty from './SchemaProperty.vue'

const { level = 0, hideModelNames = false } = defineProps<{
  schema: OpenAPIV3_1.SchemaObject
  compact?: boolean
  hideHeading?: boolean
  level?: number
  hideModelNames?: boolean
  schemas?: Schemas
  discriminator?: string
  discriminatorMapping?: Record<string, string>
  discriminatorPropertyName?: string
  hasDiscriminator?: boolean
}>()

const handleDiscriminatorChange = (type: string) => {
  // TODO: Implement
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
</script>

<template>
  <!-- <pre><code>{{ schema }}</code></pre> -->
  <!-- Properties -->
  <template v-if="schema.properties">
    <SchemaProperty
      v-for="property in Object.keys(schema.properties)"
      :key="property"
      :compact="compact"
      :hideHeading="hideHeading"
      :level="level + 1"
      :name="property"
      :hideModelNames="hideModelNames"
      :required="
        schema.required?.includes(property) ||
        schema.properties[property]?.required === true
      "
      :schemas="schemas"
      :resolvedSchema="schema.properties[property]"
      :value="{
        ...schema.properties[property],
        parent: schema,
        isDiscriminator:
          property === discriminatorPropertyName ||
          schema.discriminator?.propertyName === property,
      }"
      :discriminatorMapping="
        schema.discriminator?.mapping || discriminatorMapping
      "
      :discriminatorPropertyName="
        schema.discriminator?.propertyName || discriminatorPropertyName
      "
      :isDiscriminator="
        property ===
        (schema.discriminator?.propertyName || discriminatorPropertyName)
      "
      :modelValue="discriminator"
      @update:modelValue="handleDiscriminatorChange" />
  </template>

  <!-- patternProperties -->
  <template v-if="schema.patternProperties">
    <SchemaProperty
      v-for="property in Object.keys(schema.patternProperties)"
      :key="property"
      :compact="compact"
      :hideHeading="hideHeading"
      :level="level + 1"
      :name="property"
      :hideModelNames="hideModelNames"
      :schemas="schemas"
      :resolvedSchema="schema.patternProperties[property]"
      :value="{
        ...schema.patternProperties[property],
      }"
      :discriminatorMapping="discriminatorMapping"
      :discriminatorPropertyName="discriminatorPropertyName"
      :isDiscriminator="false"
      :modelValue="discriminator"
      @update:modelValue="handleDiscriminatorChange" />
  </template>

  <!-- additionalProperties -->
  <template v-if="schema.additionalProperties">
    <SchemaProperty
      :compact="compact"
      :hideHeading="hideHeading"
      :level="level + 1"
      :name="getAdditionalPropertiesName(schema.additionalProperties)"
      :hideModelNames="hideModelNames"
      :schemas="schemas"
      :resolvedSchema="schema.additionalProperties"
      :value="{
        ...schema.additionalProperties,
      }"
      :discriminatorMapping="discriminatorMapping"
      :discriminatorPropertyName="discriminatorPropertyName"
      :isDiscriminator="false"
      :modelValue="discriminator"
      @update:modelValue="handleDiscriminatorChange" />
  </template>
</template>
