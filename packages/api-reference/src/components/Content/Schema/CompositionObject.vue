<script lang="ts" setup>
/**
 * Takes in an OpenAPI Schema Object, renders a select if it's a composition object.
 *
 * - The selected composition is rendered in a slot.
 * - If it's a regular schema, it renders the slot directly.
 */
import { ScalarListbox, type ScalarListboxOption } from '@scalar/components'
import { ScalarIconCaretDown } from '@scalar/icons'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { computed, ref } from 'vue'

import { getSchemaType } from '@/components/Content/Schema/helpers/get-schema-type'
import type { Schemas } from '@/features/Operation/types/schemas'

const { schema, schemas } = defineProps<{
  /** The schema object to check for composition */
  schema?: OpenAPIV3_1.SchemaObject
  /** All schemas for model name retrieval */
  schemas?: Schemas
  /** Whether to show a compact layout */
  compact?: boolean
}>()

const selectedIndex = ref(0)

/**
 * Check if the schema is a composition object.
 * Composition objects have oneOf, anyOf, or allOf keywords.
 * Discriminators are optional and provide additional functionality.
 */
const isCompositionObject = computed(() => {
  if (!schema) return false

  // Check if schema has composition keywords
  const hasComposition = schema.oneOf || schema.anyOf || schema.allOf
  return !!hasComposition
})

/**
 * Check if the composition object has a discriminator.
 */
const hasDiscriminator = computed(() => {
  return !!schema?.discriminator
})

/**
 * Get the composition schemas from the discriminator mapping.
 * If no explicit mapping is provided, use the schemas from the composition keywords.
 */
const compositionSchemas = computed(() => {
  if (!isCompositionObject.value || !schema) return []

  const compositionSchemas = schema.oneOf || schema.anyOf || schema.allOf || []

  // If discriminator has explicit mapping, use it
  if (
    hasDiscriminator.value &&
    schema.discriminator?.mapping &&
    Object.keys(schema.discriminator.mapping).length > 0
  ) {
    return Object.entries(schema.discriminator.mapping).map(
      ([key, schemaRef]) => {
        // Try to resolve the schema reference
        const resolvedSchema = resolveSchemaReference(
          schemaRef as string,
          schemas,
        )
        return {
          key,
          schema: resolvedSchema || { type: 'object', title: key },
          label: resolvedSchema?.title || key,
        }
      },
    )
  }

  // Otherwise, use the composition schemas directly, but resolve $ref objects
  return compositionSchemas.map(
    (schemaItem: OpenAPIV3_1.SchemaObject, index: number) => {
      // Resolve $ref objects if present
      let resolvedSchema = schemaItem
      if ('$ref' in schemaItem) {
        const resolved = resolveSchemaReference(
          schemaItem.$ref as string,
          schemas,
        )
        if (resolved) {
          resolvedSchema = resolved
        } else if (schemas) {
          // If schemas are provided but resolution failed, use the original
          resolvedSchema = schemaItem
        } else {
          // If no schemas provided, return undefined
          return {
            key: String(index),
            schema: undefined,
            label: `Schema ${index + 1}`,
          }
        }
      }

      return {
        key: String(index),
        schema: resolvedSchema,
        label: getSchemaType(resolvedSchema) || `Schema ${index + 1}`,
      }
    },
  )
})

/**
 * Resolve a schema reference to get the actual schema object.
 */
const resolveSchemaReference = (
  schemaRef: string,
  schemas?: Schemas,
): OpenAPIV3_1.SchemaObject | undefined => {
  if (!schemas || !schemaRef) return undefined

  // Handle $ref format: #/components/schemas/SchemaName
  if (schemaRef.startsWith('#/components/schemas/')) {
    const schemaName = schemaRef.replace('#/components/schemas/', '')
    return (schemas as Record<string, OpenAPIV3_1.SchemaObject>)[schemaName]
  }

  // Handle direct schema name
  return (schemas as Record<string, OpenAPIV3_1.SchemaObject>)[schemaRef]
}

/**
 * Listbox options for the discriminator schemas
 */
const listboxOptions = computed((): ScalarListboxOption[] => {
  return compositionSchemas.value.map(
    (item: { key: string; label: string }) => ({
      id: item.key,
      label: item.label,
    }),
  )
})

/**
 * Currently selected option
 */
const selectedOption = computed({
  get: () => {
    const option = listboxOptions.value.find(
      (opt: ScalarListboxOption) => opt.id === String(selectedIndex.value),
    )
    return option || listboxOptions.value[0]
  },
  set: (opt: ScalarListboxOption) => {
    const index = Number(opt.id)
    selectedIndex.value = index
  },
})

/**
 * Currently selected schema
 */
const selectedSchema = computed(() => {
  return compositionSchemas.value[selectedIndex.value]?.schema
})

/**
 * Humanize the composition type for display
 */
const humanizeCompositionType = computed(() => {
  if (!schema) {
    return ''
  }

  if (schema.oneOf) {
    return 'One of'
  }

  if (schema.anyOf) {
    return 'Any of'
  }

  if (schema.allOf) {
    return 'All of'
  }

  return ''
})
</script>

<template>
  <div
    v-if="schema"
    class="schema-composition">
    <!-- If not a composition object, render slot directly -->
    <template v-if="!isCompositionObject">
      <slot :schema="schema" />
    </template>

    <!-- If it's a composition object, show discriminator selector -->
    <template v-else>
      <ScalarListbox
        v-model="selectedOption"
        :options="listboxOptions"
        resize>
        <button
          class="composition-selector bg-b-1.5 hover:bg-b-2 flex w-full cursor-pointer items-center gap-1 rounded-t-lg border border-b-0 px-2 py-1.25 pr-3 text-left"
          type="button">
          <span class="text-c-2">{{ humanizeCompositionType }}</span>
          <span class="composition-selector-label text-c-1">
            {{ selectedOption?.label || 'Schema' }}
          </span>
          <ScalarIconCaretDown />
        </button>
      </ScalarListbox>

      <div class="composition-panel">
        <slot :schema="selectedSchema" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.schema-composition {
  display: flex;
  flex-direction: column;
}

.composition-selector {
  transition: background-color 0.2s ease;
  font-size: var(--scalar-small);
}

.composition-panel {
  border: 1px solid var(--scalar-border-color);
  border-top: none;
  border-radius: 0 0 6px 6px;
  background: var(--scalar-background-1);
  padding: 2px 4px;
}
</style>
