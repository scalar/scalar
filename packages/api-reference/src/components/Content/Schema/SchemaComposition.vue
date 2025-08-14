<script lang="ts" setup>
import { ScalarListbox, type ScalarListboxOption } from '@scalar/components'
import { ScalarIconCaretDown } from '@scalar/icons'
import type { DiscriminatorObject } from '@scalar/workspace-store/schemas/v3.1/strict/discriminator'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/schema'
import { computed, ref } from 'vue'

import { getSchemaType } from './helpers/get-schema-type'
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
    /** Breadcrumb for navigation */
    breadcrumb?: string[]
  }>(),
  {
    compact: false,
    hideHeading: false,
  },
)

/** The current composition */
const composition = computed(() => {
  const comp = props.value[props.composition]
  return Array.isArray(comp) ? comp : []
})

/**
 * Generate listbox options for the composition selector.
 * Each option represents a schema in the composition with a human-readable label.
 */
const listboxOptions = computed((): ScalarListboxOption[] =>
  composition.value.map((schema: SchemaObject, index: number) => ({
    id: String(index),
    label: getSchemaType(schema) || 'Schema',
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
  () => composition.value[Number(selectedOption.value.id)],
)
</script>

<template>
  <div class="property-rule">
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
        :discriminator="discriminator"
        :compact="compact"
        :level="level + 1"
        :hide-heading="hideHeading"
        :name="name"
        :noncollapsible="true"
        :value="selectedComposition" />
    </div>
  </div>
</template>
