<script lang="ts" setup>
import { ScalarListbox, type ScalarListboxOption } from '@scalar/components'
import { ScalarIconCaretDown } from '@scalar/icons'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { DiscriminatorObject } from '@scalar/workspace-store/schemas/v3.1/strict/discriminator'
import { computed, ref } from 'vue'

import { getSchemaType } from './helpers/get-schema-type'
import { mergeAllOfSchemas } from './helpers/merge-all-of-schemas'
import {
  hasComposition,
  type CompositionKeyword,
} from './helpers/schema-composition'
import Schema from './Schema.vue'

const { value, composition } = defineProps<{
  composition: CompositionKeyword
  discriminator?: DiscriminatorObject
  name?: string
  value: Record<string, any>
  level: number
  compact?: boolean
  hideHeading?: boolean
  breadcrumb?: string[]
}>()

const selectedIndex = ref(0)

/** Get the composition schemas to display in the composition panel */
const compositionDisplay = computed(() => {
  // Always use the processed schemaComposition to ensure allOf schemas are properly merged
  return schemaComposition.value
})

const listboxOptions = computed(() =>
  compositionDisplay.value.map(
    (schema: OpenAPIV3_1.SchemaObject, index: number) => ({
      id: String(index),
      label: getSchemaType(schema) || 'Schema',
    }),
  ),
)

const selectedOption = computed({
  get: () =>
    listboxOptions.value.find(
      (opt: ScalarListboxOption) => opt.id === String(selectedIndex.value),
    ),
  set: (opt: ScalarListboxOption) => (selectedIndex.value = Number(opt.id)),
})

/** Check if the composition keyword is oneOf or anyOf or allOf with nested composition keywords */
const hasNestedComposition = computed(() => {
  const isOneOfOrAnyOf = ['oneOf', 'anyOf'].includes(composition)
  const hasNestedCompositionInAllOf =
    composition === 'allOf' &&
    value[composition]?.some((schema: any) => hasComposition(schema))

  return isOneOfOrAnyOf || hasNestedCompositionInAllOf
})

const getSchemaWithComposition = (schemas: any[]) => {
  return schemas.find((schema: any) => hasComposition(schema))
}

/** Checks if a schema contains nestd composition */
const schemaHasNestedComposition = (schema: any): boolean => {
  if (!schema.allOf || !Array.isArray(schema.allOf)) {
    return false
  }

  return schema.allOf.some(
    (subSchema: any) => subSchema.oneOf || subSchema.anyOf || subSchema.allOf,
  )
}

/**
 * Processes a single schema, merging allOf if it doesn't contain nested compositions.
 */
const processSchema = (schema: any): any => {
  if (schema.allOf && Array.isArray(schema.allOf)) {
    return schemaHasNestedComposition(schema)
      ? schema
      : mergeAllOfSchemas(schema.allOf)
  }
  return schema
}

const schemaComposition = computed(() => {
  const schemas = value[composition]
  const schemaWithComposition = getSchemaWithComposition(schemas)

  // No nested compositions, just process each schema
  if (
    !schemaWithComposition ||
    (composition !== 'allOf' && schemaWithComposition.allOf)
  ) {
    return schemas.map(processSchema)
  }

  // Handle nested compositions (like allOf containing oneOf)
  const nestedComposition =
    schemaWithComposition.oneOf ||
    schemaWithComposition.anyOf ||
    schemaWithComposition.allOf

  return nestedComposition.map(processSchema)
})

/** Humanizes composition keyword name e.g. oneOf -> One of */
const humanizeType = (type: CompositionKeyword) => {
  if (type === 'allOf') {
    const schemaWithComposition = value?.[type]?.find((schema: any) =>
      hasComposition(schema),
    )
    if (schemaWithComposition?.oneOf) {
      return 'One of'
    }
    if (schemaWithComposition?.anyOf) {
      return 'Any of'
    }
  }

  return type
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .toLowerCase()
    .replace(/^(\w)/, (c) => c.toUpperCase())
}

/** Get current composition schema */
const compositionSchema = computed(
  () => schemaComposition.value[selectedIndex.value],
)

/** Return current composition keyword */
const compositionType = computed<CompositionKeyword>(() => {
  return compositionSchema.value?.oneOf ? 'oneOf' : 'anyOf'
})

/** Return current schema's composition value */
const compositionValue = computed(() => {
  const type = compositionType.value
  return compositionSchema.value?.[type]
})

/** Check if the composition schema should be rendered */
const shouldRenderSchema = computed(() => {
  const schema = compositionSchema.value
  if (!schema) {
    return false
  }

  return !!(
    schema.properties ||
    schema.type ||
    schema.nullable ||
    schema.const !== undefined ||
    schema.enum ||
    schema.allOf ||
    schema.oneOf ||
    schema.anyOf ||
    schema.items
  )
})
</script>

<template>
  <div class="property-rule">
    <template
      v-if="
        composition === 'allOf' &&
        value[composition].some((schema: any) => schema.oneOf || schema.anyOf)
      ">
      <Schema
        v-for="(schema, index) in value[composition].filter(
          (s: any) => !s.oneOf && !s.anyOf,
        )"
        :key="index"
        :breadcrumb="breadcrumb"
        :compact="compact"
        :level="level"
        :name="name"
        :noncollapsible="level != 0 ? false : true"
        :value="schema" />
    </template>

    <!-- Tabs -->
    <template v-if="hasNestedComposition">
      <ScalarListbox
        v-model="selectedOption"
        :options="listboxOptions"
        resize>
        <button
          class="composition-selector bg-b-1.5 hover:bg-b-2 flex w-full cursor-pointer items-center gap-1 rounded-t-lg border border-b-0 px-2 py-1.25 pr-3 text-left"
          type="button">
          <span class="text-c-2">{{ humanizeType(composition) }}</span>
          <span class="composition-selector-label text-c-1">
            {{ selectedOption?.label || 'Schema' }}
          </span>
          <ScalarIconCaretDown />
        </button>
      </ScalarListbox>
      <div class="composition-panel">
        <Schema
          v-if="shouldRenderSchema"
          :breadcrumb="breadcrumb"
          :discriminator
          :compact="compact"
          :level="level + 1"
          :hideHeading="hideHeading"
          :name="name"
          :noncollapsible="true"
          :value="
            compositionSchema?.properties
              ? {
                  type: 'object',
                  properties: compositionSchema.properties,
                  required: compositionSchema.required,
                }
              : compositionSchema
          " />
        <!-- Nested tabs -->
        <template v-if="compositionSchema?.oneOf || compositionSchema?.anyOf">
          <SchemaComposition
            :breadcrumb="breadcrumb"
            :compact="compact"
            :composition="compositionType"
            :discriminator
            :hideHeading="hideHeading"
            :level="level + 1"
            :name="name"
            :noncollapsible="true"
            :value="{
              [compositionType]: compositionValue,
            }" />
        </template>
      </div>
    </template>
    <!-- TODO: we will no longer merge all of schemas -->
    <!-- <template v-else> -->
    <!-- <Schema
        :breadcrumb="breadcrumb"
        :compact="compact"
        :level="level"
        :name="name"
        :noncollapsible="level != 0 ? false : true"
        :value="mergeAllOfSchemas(value[composition])" /> -->
    <!-- </template> -->
  </div>
</template>
