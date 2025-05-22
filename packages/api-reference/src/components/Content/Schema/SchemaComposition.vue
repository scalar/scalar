<script lang="ts" setup>
import {
  ScalarListbox,
  ScalarMarkdown,
  type ScalarListboxOption,
} from '@scalar/components'
import { ScalarIconCaretDown } from '@scalar/icons'
import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'
import { stringify } from 'flatted'
import { computed, ref } from 'vue'

import { mergeAllOfSchemas } from '@/components/Content/Schema/helpers/merge-all-of-schemas'

import {
  hasComposition,
  type CompositionKeyword,
} from './helpers/schema-composition'
import Schema from './Schema.vue'

const { schemas, value, composition } = defineProps<{
  composition: CompositionKeyword
  schemas?:
    | OpenAPIV2.DefinitionsObject
    | Record<string, OpenAPIV3.SchemaObject>
    | Record<string, OpenAPIV3_1.SchemaObject>
    | unknown
  name?: string
  value: Record<string, any>
  level: number
  compact?: boolean
  hideHeading?: boolean
}>()

const selectedIndex = ref(0)

const listboxOptions = computed(() =>
  schemaComposition.value.map((schema: any, index: number) => ({
    id: String(index),
    label: getModelNameFromSchema(schema) || 'Schema',
  })),
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
  const hasNestedComposition =
    composition === 'allOf' &&
    value[composition]?.some((schema: any) => hasComposition(schema))

  return isOneOfOrAnyOf || hasNestedComposition
})

/** Get model name from schema */
const getModelNameFromSchema = (schema: any): string | null => {
  if (!schema) {
    return null
  }

  if (schema.title) {
    return schema.title
  }

  if (schema.name) {
    return schema.name
  }

  // returns a matching schema name based on the schema object
  if (schemas && typeof schemas === 'object') {
    for (const [schemaName, schemaValue] of Object.entries(schemas)) {
      if (stringify(schemaValue) === stringify(schema)) {
        return schemaName
      }
    }
  }

  // Handle array types with items
  if (schema.type === 'array' && schema.items) {
    const itemType = schema.items.type || 'any'
    return `Array of ${itemType}`
  }

  if (schema.type) {
    return schema.type
  }

  if (typeof schema === 'object') {
    const keys = Object.keys(schema)
    if (keys.length > 0) {
      return keys[0]
    }
  }

  return null
}

const getSchemaWithComposition = (schemas: any[]) => {
  return schemas.find((schema: any) => hasComposition(schema))
}

const schemaComposition = computed(() => {
  const schemaComposition = getSchemaWithComposition(value[composition])

  if (!schemaComposition) {
    return value[composition]
  }

  // Get schema with nested composition
  const schemaNestedComposition =
    schemaComposition.oneOf || schemaComposition.anyOf

  return schemaNestedComposition.map((schema: any) => {
    if (schema.allOf) {
      const titledSchema = schema.allOf.find((s: any) => s.title)
      const referencedSchema = schema.allOf.find((s: any) => !s.title)

      if (titledSchema && referencedSchema) {
        return {
          ...titledSchema,
          properties: {
            ...titledSchema.properties,
            ...referencedSchema.properties,
          },
          required: [
            ...(titledSchema.required || []),
            ...(referencedSchema.required || []),
          ],
          oneOf: referencedSchema.oneOf,
          anyOf: referencedSchema.anyOf,
        }
      }
      return titledSchema || schema
    }
    return schema
  })
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
          class="composition-selector bg-b-1.5 hover:bg-b-2 py-1.25 flex w-full cursor-pointer items-center gap-1 rounded-t-lg border border-b-0 px-2 pr-3 text-left"
          type="button">
          <span class="text-c-2">{{ humanizeType(composition) }}</span>
          <span class="composition-selector-label text-c-1 relative">
            {{ selectedOption?.label || 'Schema' }}
          </span>
          <ScalarIconCaretDown class="z-1" />
        </button>
      </ScalarListbox>
      <div class="composition-panel">
        <div
          v-if="compositionSchema?.description"
          class="property-description border-x border-t p-2">
          <ScalarMarkdown :value="compositionSchema.description" />
        </div>
        <Schema
          v-if="compositionSchema?.properties"
          :compact="compact"
          :level="level + 1"
          :hideHeading="hideHeading"
          :name="name"
          :noncollapsible="true"
          :schemas="schemas"
          :value="{
            type: 'object',
            properties: compositionSchema.properties,
          }" />
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
