<script lang="ts" setup>
import {
  ScalarListbox,
  ScalarMarkdown,
  type ScalarListboxOption,
} from '@scalar/components'
import { ScalarIconCaretDown } from '@scalar/icons'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { computed, ref } from 'vue'

import { mergeAllOfSchemas } from '@/components/Content/Schema/helpers/merge-all-of-schemas'
import { getModelNameFromSchema } from '@/components/Content/Schema/helpers/schema-name'
import type { Schemas } from '@/features/Operation/types/schemas'

import {
  hasComposition,
  type CompositionKeyword,
} from './helpers/schema-composition'
import Schema from './Schema.vue'

const { schemas, value, composition } = defineProps<{
  composition: CompositionKeyword
  schemas?: Schemas
  name?: string
  value: Record<string, any>
  level: number
  compact?: boolean
  hideHeading?: boolean
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
      label: getModelNameFromSchema(schema) || 'Schema',
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
        :compact="compact"
        :level="level"
        :name="name"
        :noncollapsible="level != 0 ? false : true"
        :schemas="schemas"
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
        <div
          v-if="compositionSchema?.description"
          class="property-description border-x border-t p-2">
          <ScalarMarkdown :value="compositionSchema.description" />
        </div>
        <Schema
          v-if="shouldRenderSchema"
          :compact="compact"
          :level="level + 1"
          :hideHeading="hideHeading"
          :name="name"
          :noncollapsible="true"
          :schemas="schemas"
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
            :compact="compact"
            :composition="compositionType"
            :hideHeading="hideHeading"
            :level="level + 1"
            :name="name"
            :noncollapsible="true"
            :schemas="schemas"
            :value="{
              [compositionType]: compositionValue,
            }" />
        </template>
      </div>
    </template>
    <template v-else>
      <Schema
        :compact="compact"
        :level="level"
        :name="name"
        :noncollapsible="level != 0 ? false : true"
        :schemas="schemas"
        :value="mergeAllOfSchemas(value[composition])" />
    </template>
  </div>
</template>
