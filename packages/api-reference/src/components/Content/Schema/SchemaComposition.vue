<script lang="ts" setup>
import { ScalarListbox, type ScalarListboxOption } from '@scalar/components'
import { isDefined } from '@scalar/helpers/array/is-defined'
import { ScalarIconCaretDown } from '@scalar/icons'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  DiscriminatorObject,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, ref } from 'vue'

import { getSchemaType } from './helpers/get-schema-type'
import { mergeAllOfSchemas } from './helpers/merge-all-of-schemas'
import { type CompositionKeyword } from './helpers/schema-composition'
import Schema from './Schema.vue'

const props = withDefaults(
  defineProps<{
    /** The composition keyword (oneOf, anyOf, allOf) */
    composition: CompositionKeyword
    /** Optional discriminator object for polymorphic schemas */
    discriminator?: DiscriminatorObject
    /** Optional name for the schema */
    name?: string
    /** The schema value containing the composition */
    value: SchemaObject
    /** Nesting level for proper indentation */
    level: number
    /** Whether to use compact layout */
    compact?: boolean
    /** Whether to hide the heading */
    hideHeading?: boolean
    /** Whether to hide read-only properties */
    hideReadOnly?: boolean
    /** Hide write-only properties */
    hideWriteOnly?: boolean
    /** Breadcrumb for navigation */
    breadcrumb?: string[]
  }>(),
  {
    compact: false,
    hideHeading: false,
  },
)

/** The current composition */
const composition = computed(() =>
  [props.value[props.composition]]
    .flat()
    .map((schema) => ({ value: getResolvedRef(schema), original: schema }))
    .filter((it) => isDefined(it.value)),
)

/**
 * Generate listbox options for the composition selector.
 * Each option represents a schema in the composition with a human-readable label.
 */
const listboxOptions = computed((): ScalarListboxOption[] =>
  composition.value.map((schema, index: number) => ({
    id: String(index),
    label: getSchemaType(schema.original!) || 'Schema',
  })),
)

/**
 * Two-way computed property for the selected option.
 * Handles conversion between the selected index and the listbox option format.
 */
const selectedOption = ref<ScalarListboxOption>(listboxOptions.value[0])

/**
 * Humanize composition keyword name for display.
 * Converts camelCase to Title Case (e.g., oneOf -> One of).
 */
const humanizeType = (type: CompositionKeyword): string =>
  type
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .toLowerCase()
    .replace(/^(\w)/, (c) => c.toUpperCase())

/** Inside the currently selected composition */
const selectedComposition = computed(
  () => composition.value[Number(selectedOption.value.id)].value,
)
</script>

<template>
  <div class="property-rule">
    <!-- We merge allOf schemas into a single schema -->
    <Schema
      v-if="props.composition === 'allOf'"
      :breadcrumb="breadcrumb"
      :compact="compact"
      :discriminator="discriminator"
      :hideHeading="hideHeading"
      :hideReadOnly="hideReadOnly"
      :hideWriteOnly="hideWriteOnly"
      :level="level"
      :name="name"
      :noncollapsible="true"
      :schema="mergeAllOfSchemas(props.value)" />

    <template v-else>
      <!-- Composition selector and panel for nested compositions -->
      <ScalarListbox
        v-model="selectedOption"
        :options="listboxOptions"
        resize>
        <button
          class="composition-selector bg-b-1.5 hover:bg-b-2 flex w-full cursor-pointer items-center gap-1 rounded-t-lg border border-b-0 px-2 py-1.25 pr-3 text-left"
          type="button">
          <span class="text-c-2">{{ humanizeType(props.composition) }}</span>
          <span
            class="composition-selector-label text-c-1"
            :class="{
              'line-through': selectedComposition?.deprecated,
            }">
            {{ selectedOption?.label || 'Schema' }}
          </span>
          <div
            v-if="selectedComposition?.deprecated"
            class="text-red">
            deprecated
          </div>
          <ScalarIconCaretDown />
        </button>
      </ScalarListbox>

      <div class="composition-panel">
        <!-- Render the selected schema if it has content to display -->
        <Schema
          :breadcrumb="breadcrumb"
          :compact="compact"
          :discriminator="discriminator"
          :hideHeading="hideHeading"
          :hideReadOnly="hideReadOnly"
          :hideWriteOnly="hideWriteOnly"
          :level="level + 1"
          :name="name"
          :noncollapsible="true"
          :schema="selectedComposition" />
      </div>
    </template>
  </div>
</template>
