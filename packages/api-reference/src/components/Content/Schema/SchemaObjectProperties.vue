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

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

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
  <!-- <pre><code>{{ schema }}</code></pre> -->
  <!-- Properties -->
  <template v-if="schema.properties">
    <SchemaProperty
      v-for="property in Object.keys(schema.properties)"
      :key="property"
      :compact="compact"
      :hideHeading="hideHeading"
      :level="level"
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
      variant="patternProperties"
      :compact="compact"
      :hideHeading="hideHeading"
      :level="level"
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
      variant="additionalProperties"
      :compact="compact"
      :hideHeading="hideHeading"
      :level="level"
      :name="getAdditionalPropertiesName(schema.additionalProperties)"
      :hideModelNames="hideModelNames"
      :schemas="schemas"
      :resolvedSchema="
        getAdditionalPropertiesValue(schema.additionalProperties)
      "
      :value="getAdditionalPropertiesValue(schema.additionalProperties)"
      :discriminatorMapping="discriminatorMapping"
      :discriminatorPropertyName="discriminatorPropertyName"
      :isDiscriminator="false"
      :modelValue="discriminator"
      noncollapsible
      @update:modelValue="handleDiscriminatorChange" />
  </template>
</template>
