<script setup lang="ts">
import { ScalarButton } from '@scalar/components'
import { ScalarIconPlus } from '@scalar/icons'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { isArraySchema } from '@scalar/workspace-store/schemas/v3.1/strict/type-guards'
import { computed, ref } from 'vue'

import SchemaEnumPropertyItem from './SchemaEnumPropertyItem.vue'

const { value } = defineProps<{
  /** The schema object containing enum values and metadata */
  value: SchemaObject | undefined
}>()

const ENUM_DISPLAY_THRESHOLD = 9
const INITIAL_VISIBLE_COUNT = 5
const THIN_SPACE = '\u2009'

/**
 * Extracts enum values from the schema object.
 * Handles both direct enum values and nested enum arrays.
 */
const enumValues = computed(() => {
  if (!value) {
    return []
  }
  return (
    value.enum ||
    (isArraySchema(value) && getResolvedRef(value.items)?.enum) ||
    []
  )
})

/**
 * Determines if we should show the long enum list UI.
 * When there are many enum values, we initially show only a subset.
 */
const shouldUseLongListDisplay = computed(
  () => enumValues.value.length > ENUM_DISPLAY_THRESHOLD,
)

const initialVisibleCount = computed(() =>
  shouldUseLongListDisplay.value
    ? INITIAL_VISIBLE_COUNT
    : enumValues.value.length,
)

const visibleEnumValues = computed(() =>
  enumValues.value.slice(0, initialVisibleCount.value),
)

const hiddenEnumValues = computed(() =>
  enumValues.value.slice(initialVisibleCount.value),
)

/**
 * Gets the description for an enum value.
 * Supports both array and object formats for x-enumDescriptions.
 */
const getEnumValueDescription = (
  enumValue: any,
  index: number,
): string | undefined => {
  const descriptions =
    value?.['x-enumDescriptions'] ?? value?.['x-enum-descriptions']

  if (!descriptions) {
    return undefined
  }

  if (Array.isArray(descriptions)) {
    return descriptions[index]
  }

  if (typeof descriptions === 'object' && descriptions !== null) {
    return (descriptions as Record<string, string>)[String(enumValue)]
  }

  return undefined
}

/**
 * Formats an enum value with its variable name if available.
 * This supports both x-enum-varnames and x-enumNames extensions.
 */
const formatEnumValueWithName = (enumValue: any, index: number): string => {
  const varNames = value?.['x-enum-varnames'] ?? value?.['x-enumNames']
  const varName = Array.isArray(varNames) ? varNames[index] : undefined
  return varName
    ? `${enumValue}${THIN_SPACE}=${THIN_SPACE}${varName}`
    : String(enumValue)
}

/**
 * Controls whether the hidden enum values are visible.
 */
const isExpanded = ref(false)

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <div
    v-if="enumValues.length > 0"
    class="property-enum">
    <ul class="property-enum-values">
      <!-- Visible enum values -->
      <SchemaEnumPropertyItem
        v-for="(enumValue, index) in visibleEnumValues"
        :key="String(enumValue)"
        :description="getEnumValueDescription(enumValue, index)"
        :label="formatEnumValueWithName(enumValue, index)" />

      <!-- Hidden enum values (when expanded) -->
      <template v-if="shouldUseLongListDisplay && isExpanded">
        <SchemaEnumPropertyItem
          v-for="(enumValue, index) in hiddenEnumValues"
          :key="String(enumValue)"
          :description="
            getEnumValueDescription(enumValue, initialVisibleCount + index)
          "
          :label="
            formatEnumValueWithName(enumValue, initialVisibleCount + index)
          " />
      </template>

      <!-- Toggle button for long lists -->
      <li v-if="shouldUseLongListDisplay">
        <ScalarButton
          class="enum-toggle-button my-2 flex h-fit gap-1 rounded-full border py-1.5 pr-2.5 pl-2 leading-none"
          variant="ghost"
          @click="toggleExpanded">
          <ScalarIconPlus
            :class="{ 'rotate-45': isExpanded }"
            weight="bold" />
          {{ isExpanded ? 'Hide values' : 'Show all values' }}
        </ScalarButton>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.property-heading:empty + .property-description:last-of-type,
.property-description:first-of-type:last-of-type {
  margin-top: 0;
}

.property-list {
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-radius: var(--scalar-radius);
  margin-top: 10px;
}

.property-list .property:last-of-type {
  padding-bottom: 10px;
}

.property-enum-values {
  font-size: var(--scalar-font-size-3);
  list-style: none;
  margin-top: 8px;
  padding-left: 2px;
}

.enum-toggle-button:hover {
  color: var(--scalar-color-1);
}
</style>
