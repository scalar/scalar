<script lang="ts" setup>
import { ScalarListbox, type ScalarListboxOption } from '@scalar/components'
import { ScalarIconCaretDown } from '@scalar/icons'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { DiscriminatorObject } from '@scalar/workspace-store/schemas/v3.1/strict/discriminator'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/schema'
import { computed, ref } from 'vue'

import { getSchemaType } from './helpers/get-schema-type'
import {
  hasComposition,
  type CompositionKeyword,
} from './helpers/schema-composition'
import Schema from './Schema.vue'

/**
 * Props for the SchemaComposition component.
 * Handles rendering of OpenAPI schema composition keywords (oneOf, anyOf, allOf).
 */
interface Props {
  /** The composition keyword (oneOf, anyOf, allOf) */
  composition: CompositionKeyword
  /** Optional discriminator object for polymorphic schemas */
  discriminator?: DiscriminatorObject
  /** Optional name for the schema */
  name?: string
  /** The schema value containing the composition */
  value: Record<string, any>
  /** Nesting level for proper indentation */
  level: number
  /** Whether to use compact layout */
  compact?: boolean
  /** Whether to hide the heading */
  hideHeading?: boolean
  /** Breadcrumb for navigation */
  breadcrumb?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
  hideHeading: false,
})

/** Currently selected schema index in the composition */
const selectedIndex = ref(0)

/**
 * Get the composition schemas to display in the composition panel.
 * Handles nested compositions by processing allOf schemas that contain other composition keywords.
 */
const schemaComposition = computed(() => {
  const schemas = props.value[props.composition] as OpenAPIV3_1.SchemaObject[]
  if (!Array.isArray(schemas)) {
    return []
  }

  const schemaWithComposition = schemas.find((schema) => hasComposition(schema))

  // No nested compositions, return schemas as-is
  if (!schemaWithComposition) {
    return schemas
  }

  // Handle nested compositions (like allOf containing oneOf)
  const nestedComposition =
    schemaWithComposition.oneOf ||
    schemaWithComposition.anyOf ||
    schemaWithComposition.allOf

  return nestedComposition || schemas
})

/**
 * Get the composition schemas to display in the composition panel.
 * Always uses the processed schemaComposition to ensure allOf schemas are properly merged.
 */
const compositionDisplay = computed(() => schemaComposition.value)

/**
 * Generate listbox options for the composition selector.
 * Each option represents a schema in the composition with a human-readable label.
 */
const listboxOptions = computed((): ScalarListboxOption[] =>
  compositionDisplay.value.map(
    (schema: OpenAPIV3_1.SchemaObject, index: number) => ({
      id: String(index),
      label: getSchemaType(schema) || 'Schema',
    }),
  ),
)

/**
 * Two-way computed property for the selected option.
 * Handles conversion between the selected index and the listbox option format.
 */
const selectedOption = computed({
  get: (): ScalarListboxOption | undefined =>
    listboxOptions.value.find(
      (opt: ScalarListboxOption) => opt.id === String(selectedIndex.value),
    ),
  set: (opt: ScalarListboxOption) => {
    selectedIndex.value = Number(opt.id)
  },
})

/**
 * Check if the composition keyword is oneOf, anyOf, or allOf with nested composition keywords.
 * This determines whether to show the composition selector UI.
 */
const hasNestedComposition = computed((): boolean => {
  const compositionTypes = ['oneOf', 'allOf', 'anyOf'] as const
  return compositionTypes.includes(
    props.composition as (typeof compositionTypes)[number],
  )
})

/**
 * Humanize composition keyword name for display.
 * Converts camelCase to Title Case (e.g., oneOf -> One of).
 */
const humanizeType = (type: CompositionKeyword): string => {
  if (type === 'allOf') {
    const schemaWithComposition = props.value?.[type]?.find((schema: any) =>
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

/**
 * Get the currently selected composition schema.
 */
const compositionSchema = computed(
  (): OpenAPIV3_1.SchemaObject | undefined =>
    schemaComposition.value[selectedIndex.value],
)

/**
 * Determine the current composition keyword for nested compositions.
 */
const compositionType = computed((): CompositionKeyword => {
  if (compositionSchema.value?.oneOf) return 'oneOf'
  if (compositionSchema.value?.anyOf) return 'anyOf'
  return 'allOf'
})

/**
 * Get the current schema's composition value for nested compositions.
 */
const compositionValue = computed(() => {
  const type = compositionType.value
  return compositionSchema.value?.[type]
})

/**
 * Check if the composition schema should be rendered.
 * Only renders schemas that have meaningful content to display.
 */
const shouldRenderSchema = computed((): boolean => {
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

/**
 * Check if the current composition has nested composition keywords.
 */
const hasNestedCompositionInCurrent = computed((): boolean => {
  return !!(compositionSchema.value?.oneOf || compositionSchema.value?.anyOf)
})

/**
 * Get the properly typed schema value for the Schema component.
 * Handles the case where we need to create an object schema from properties.
 */
const schemaValue = computed((): SchemaObject | undefined => {
  const schema = compositionSchema.value
  if (!schema) {
    return undefined
  }

  if (schema.properties) {
    return {
      type: 'object',
      properties: schema.properties,
      required: schema.required,
    } as SchemaObject
  }

  return schema as SchemaObject
})
</script>

<template>
  <div class="property-rule">
    <!-- Handle allOf schemas with nested compositions -->
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
        :noncollapsible="level !== 0"
        :value="schema" />
    </template>

    <!-- Composition selector and panel for nested compositions -->
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
        <!-- Render the selected schema if it has content to display -->
        <Schema
          v-if="shouldRenderSchema"
          :breadcrumb="breadcrumb"
          :discriminator="discriminator"
          :compact="compact"
          :level="level + 1"
          :hide-heading="hideHeading"
          :name="name"
          :noncollapsible="true"
          :value="schemaValue" />

        <!-- Handle nested compositions recursively -->
        <template v-if="hasNestedCompositionInCurrent">
          <SchemaComposition
            :breadcrumb="breadcrumb"
            :compact="compact"
            :composition="compositionType"
            :discriminator="discriminator"
            :hide-heading="hideHeading"
            :level="level + 1"
            :name="name"
            :noncollapsible="true"
            :value="{
              [compositionType]: compositionValue,
            }" />
        </template>
      </div>
    </template>
  </div>
</template>
