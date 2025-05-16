<script lang="ts" setup>
import {
  ScalarListbox,
  ScalarMarkdown,
  type ScalarListboxOption,
} from '@scalar/components'
import { ScalarIconCaretDown } from '@scalar/icons'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { stringify } from 'flatted'
import { computed, ref } from 'vue'

import { mergeAllOfSchemas } from '@/components/Content/Schema/helpers/merge-all-of-schemas'

import {
  hasDiscriminator,
  type DiscriminatorType,
} from './helpers/schema-discriminator'
import Schema from './Schema.vue'

const { schemas, value, discriminator } = defineProps<{
  discriminator: DiscriminatorType
  schemas?: Record<string, OpenAPIV3_1.SchemaObject> | unknown
  name?: string
  value: Record<string, any>
  level: number
  compact?: boolean
  hideHeading?: boolean
}>()

const selectedIndex = ref(0)

const listboxOptions = computed(() =>
  schemaDiscriminators.value.map((schema: any, index: number) => ({
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

/** Check if the discriminator is oneOf or anyOf or allOf with nested discriminators */
const hasNestedDiscriminator = computed(() => {
  const isOneOfOrAnyOf = ['oneOf', 'anyOf'].includes(discriminator)
  const hasNestedDiscriminator =
    discriminator === 'allOf' &&
    value[discriminator]?.some((schema: any) => hasDiscriminator(schema))

  return isOneOfOrAnyOf || hasNestedDiscriminator
})

/** Get model name from schema */
const getModelNameFromSchema = (schema: any): string | null => {
  if (!schema) {
    return null
  }

  if (schema.name) {
    return schema.name
  }

  if (schema.title) {
    return schema.title
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

const getSchemaWithDiscriminator = (schemas: any[]) => {
  return schemas.find((schema: any) => hasDiscriminator(schema))
}

const schemaDiscriminators = computed(() => {
  const schemaDiscriminator = getSchemaWithDiscriminator(value[discriminator])

  if (!schemaDiscriminator) {
    return value[discriminator]
  }

  // Get schema with nested discriminators
  const schemaNestedDiscriminators =
    schemaDiscriminator.oneOf || schemaDiscriminator.anyOf

  return schemaNestedDiscriminators.map((schema: any) => {
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

/** Humanizes discriminator type name e.g. oneOf -> One of */
const humanizeType = (type: DiscriminatorType) => {
  if (type === 'allOf') {
    const schemaWithDiscriminator = value?.[type]?.find((schema: any) =>
      hasDiscriminator(schema),
    )
    if (schemaWithDiscriminator?.oneOf) {
      return 'One of'
    }
    if (schemaWithDiscriminator?.anyOf) {
      return 'Any of'
    }
  }

  return type
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .toLowerCase()
    .replace(/^(\w)/, (c) => c.toUpperCase())
}

/** Get current schema */
const discriminatorSchema = computed(
  () => schemaDiscriminators.value[selectedIndex.value],
)

/** Return current discriminator type */
const discriminatorType = computed<DiscriminatorType>(() => {
  return discriminatorSchema.value?.oneOf ? 'oneOf' : 'anyOf'
})

/** Return current schema's discriminator value */
const discriminatorValue = computed(() => {
  const type = discriminatorType.value
  return discriminatorSchema.value?.[type]
})
</script>

<template>
  <div class="property-rule">
    <template
      v-if="
        discriminator === 'allOf' &&
        value[discriminator].some((schema: any) => schema.oneOf || schema.anyOf)
      ">
      <Schema
        v-for="(schema, index) in value[discriminator].filter(
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
    <template v-if="hasNestedDiscriminator">
      <ScalarListbox
        v-model="selectedOption"
        :options="listboxOptions"
        resize>
        <button
          class="discriminator-selector bg-b-1.5 hover:bg-b-2 py-1.25 flex w-full cursor-pointer items-center gap-1 rounded-t-lg border border-b-0 px-2 pr-3 text-left"
          type="button">
          <span class="text-c-2">{{ humanizeType(discriminator) }}</span>
          <span class="discriminator-selector-label text-c-1 relative">
            {{ selectedOption?.label || 'Schema' }}
          </span>
          <ScalarIconCaretDown class="z-1" />
        </button>
      </ScalarListbox>
      <div class="discriminator-panel">
        <div
          v-if="discriminatorSchema?.description"
          class="property-description border-x border-t p-2">
          <ScalarMarkdown :value="discriminatorSchema.description" />
        </div>
        <Schema
          v-if="discriminatorSchema?.properties"
          :compact="compact"
          :level="level + 1"
          :hideHeading="hideHeading"
          :name="name"
          :noncollapsible="true"
          :schemas="schemas"
          :value="{
            type: 'object',
            properties: discriminatorSchema.properties,
          }" />
        <!-- Nested tabs -->
        <template
          v-if="discriminatorSchema?.oneOf || discriminatorSchema?.anyOf">
          <SchemaDiscriminator
            :compact="compact"
            :discriminator="discriminatorType"
            :hideHeading="hideHeading"
            :level="level + 1"
            :name="name"
            :noncollapsible="true"
            :schemas="schemas"
            :value="{
              [discriminatorType]: discriminatorValue,
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
        :value="mergeAllOfSchemas(value[discriminator])" />
    </template>
  </div>
</template>
