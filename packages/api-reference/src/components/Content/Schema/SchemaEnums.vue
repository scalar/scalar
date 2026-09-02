<script setup lang="ts">
import { ScalarButton } from '@scalar/components/button'
import { ScalarIconPlus } from '@scalar/icons'
import { resolve } from '@scalar/workspace-store/resolve'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { isArraySchema } from '@scalar/workspace-store/schemas/v3.1/strict/type-guards'
import { computed, ref } from 'vue'

import { useLocalization } from '@/features/localization'

import SchemaEnumPropertyItem from './SchemaEnumPropertyItem.vue'
import SchemaGlyphPuck from './SchemaGlyphPuck.vue'

const {
  value,
  layout = 'legacy',
  propertyNames = false,
} = defineProps<{
  /** The schema object containing enum values and metadata */
  value: SchemaObject | undefined
  /** Whether to display the enum for property names */
  propertyNames?: boolean
  /** The schema layout this enum renders inside */
  layout?: 'legacy' | 'tree'
}>()
const { translate } = useLocalization()

/**
 * The tree layout uses 12/8; with the legacy 9/5 a 10-value enum hides half
 * its values. The legacy layout keeps its numbers so nothing existing changes.
 */
const ENUM_DISPLAY_THRESHOLD_LEGACY = 9
const INITIAL_VISIBLE_COUNT_LEGACY = 5
const ENUM_DISPLAY_THRESHOLD_TREE = 12
const INITIAL_VISIBLE_COUNT_TREE = 8
/** Values at or under this length can render as wrapped chips */
const CHIP_MAX_LENGTH = 24
const THIN_SPACE = '\u2009'

/**
 * Resolves the schema that carries the enum values.
 * For arrays, the enum and its x-enum-* metadata live on the items schema, so
 * both the values and their varnames/descriptions have to be read from there.
 */
const enumSchema = computed(() => {
  if (!value) {
    return undefined
  }
  if (value.enum) {
    return value
  }
  return isArraySchema(value) ? resolve.schema(value.items) : undefined
})

/**
 * Extracts enum values from the schema object.
 * Handles both direct enum values and nested enum arrays.
 */
const enumValues = computed(() => enumSchema.value?.enum ?? [])

/**
 * Determines if we should show the long enum list UI.
 * When there are many enum values, we initially show only a subset.
 */
const displayThreshold = computed(() =>
  layout === 'tree'
    ? ENUM_DISPLAY_THRESHOLD_TREE
    : ENUM_DISPLAY_THRESHOLD_LEGACY,
)

const shouldUseLongListDisplay = computed(
  () => enumValues.value.length > displayThreshold.value,
)

const initialVisibleCount = computed(() =>
  shouldUseLongListDisplay.value
    ? layout === 'tree'
      ? INITIAL_VISIBLE_COUNT_TREE
      : INITIAL_VISIBLE_COUNT_LEGACY
    : enumValues.value.length,
)

/**
 * Short flat enums render as wrapped chips in the tree layout: three lines
 * instead of a 40-row wall. Values with descriptions keep the rows instead.
 */
const shouldRenderAsChips = computed(
  () =>
    layout === 'tree' &&
    !propertyNames &&
    enumValues.value.length > 0 &&
    enumValues.value.every(
      (entry) => String(entry).length <= CHIP_MAX_LENGTH,
    ) &&
    !hasAnyDescription.value,
)

/** Whether any value carries an x-enum description (chips have nowhere to put one) */
const hasAnyDescription = computed(() =>
  enumValues.value.some(
    (entry, index) => getEnumValueDescription(entry, index) !== undefined,
  ),
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
  const schema = enumSchema.value
  const descriptions =
    schema?.['x-enumDescriptions'] ?? schema?.['x-enum-descriptions']

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
  const varNames =
    enumSchema.value?.['x-enum-varnames'] ?? enumSchema.value?.['x-enumNames']
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
    v-if="enumValues.length > 0 && layout === 'tree'"
    class="property-enum property-enum--tree mt-2 rounded-(--scalar-radius-lg) border">
    <!-- Tree layout: a bordered card with a muted header row and one hairline
         row per value; the chips and the long-list toggle are rows of it too -->
    <div class="property-enum-header text-c-2 px-3 py-2 text-sm capitalize">
      {{
        propertyNames
          ? translate('common.propertyNames')
          : translate('common.values')
      }}
    </div>
    <div
      v-if="shouldRenderAsChips"
      class="property-enum-chip-list flex flex-wrap gap-1 border-t px-3 py-2"
      role="list">
      <span
        v-for="(enumValue, index) in enumValues"
        :key="String(enumValue)"
        class="property-enum-chip font-code text-c-2 rounded-(--scalar-radius-lg) border px-1.5 py-px text-(length:--scalar-mini)"
        role="listitem">
        {{ formatEnumValueWithName(enumValue, index) }}
      </span>
    </div>
    <ul
      v-else
      class="property-enum-values-card"
      role="list">
      <SchemaEnumPropertyItem
        v-for="(enumValue, index) in visibleEnumValues"
        :key="String(enumValue)"
        :description="getEnumValueDescription(enumValue, index)"
        :label="formatEnumValueWithName(enumValue, index)"
        layout="tree" />

      <template v-if="shouldUseLongListDisplay && isExpanded">
        <SchemaEnumPropertyItem
          v-for="(enumValue, index) in hiddenEnumValues"
          :key="String(enumValue)"
          :description="
            getEnumValueDescription(enumValue, initialVisibleCount + index)
          "
          :label="
            formatEnumValueWithName(enumValue, initialVisibleCount + index)
          "
          layout="tree" />
      </template>

      <li
        v-if="shouldUseLongListDisplay"
        class="border-t">
        <!-- The reveal is a tree control like the row toggles, so it draws the
             same puck and lights it the same way when the row is hovered -->
        <button
          class="enum-toggle-button group/tree-control text-c-2 hover:text-c-1 flex w-full cursor-pointer items-center gap-1.5 px-3 py-2 text-sm"
          type="button"
          @click="toggleExpanded">
          <SchemaGlyphPuck
            :floating="false"
            :open="isExpanded" />
          {{
            isExpanded
              ? translate('common.hideValues')
              : translate('common.showAllValues')
          }}
        </button>
      </li>
    </ul>
  </div>

  <!-- Legacy: untouched -->
  <div
    v-else-if="enumValues.length > 0"
    class="property-enum">
    <div
      v-if="propertyNames"
      class="property-enum-property-names">
      {{ translate('common.propertyNames') }}
    </div>
    <div
      v-else
      class="property-enum-property-names">
      {{ translate('common.values') }}
    </div>
    <ul
      class="property-enum-values"
      role="list">
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
          {{
            isExpanded
              ? translate('common.hideValues')
              : translate('common.showAllValues')
          }}
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

.property-enum-property-names {
  font-size: var(--scalar-font-size-4);
  color: var(--scalar-color-2);
  display: inline-block;
  padding: 0 2px;
  margin-top: 8px;
}
</style>
