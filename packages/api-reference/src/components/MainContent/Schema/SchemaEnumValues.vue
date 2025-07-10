<script lang="ts" setup>
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ScalarIcon } from '@scalar/components'
import { computed } from 'vue'

import SchemaEnumPropertyItem from './SchemaEnumPropertyItem.vue'

const ENUM_DISPLAY_THRESHOLD = 9
const INITIAL_VISIBLE_COUNT = 5
const THIN_SPACE = ' '

type SchemaValue = {
  'enum'?: any[]
  'items'?: { enum?: any[] }
  'x-enumDescriptions'?: Record<string, string> | string[]
  'x-enum-descriptions'?: Record<string, string> | string[]
  'x-enum-varnames'?: string[]
  'x-enumNames'?: string[]
} & Record<string, any>

// Props
const { value, isDiscriminator } = defineProps<{
  /** The schema object containing enum values and metadata */
  value?: SchemaValue
  /** Whether this enum is used as a discriminator property */
  isDiscriminator?: boolean
}>()

/**
 * Extracts enum values from the schema object.
 * Handles both direct enum values and nested enum arrays.
 */
const extractEnumValues = (schemaValue?: SchemaValue): any[] => {
  if (!schemaValue) {
    return []
  }

  return schemaValue.enum || schemaValue.items?.enum || []
}

/**
 * Formats an enum value with its variable name if available.
 * This supports both x-enum-varnames and x-enumNames extensions.
 *
 * @example "active" becomes "active = ACTIVE_STATUS"
 */
const formatEnumValueWithName = (enumValue: any, index: number): string => {
  const varName =
    value?.['x-enum-varnames']?.[index] ?? value?.['x-enumNames']?.[index]
  return varName
    ? `${enumValue}${THIN_SPACE}=${THIN_SPACE}${varName}`
    : String(enumValue)
}

/**
 * Gets the description for an enum value at a specific index.
 * Supports both x-enum-descriptions and x-enumDescriptions formats.
 */
const getEnumValueDescription = (index: number): string | undefined => {
  // Check if it's an array before using number index
  const enumDescriptions = value?.['x-enum-descriptions']

  if (Array.isArray(enumDescriptions)) {
    return enumDescriptions[index]
  }

  const xEnumDescriptions = value?.['x-enumDescriptions']

  if (Array.isArray(xEnumDescriptions)) {
    return xEnumDescriptions[index]
  }

  return undefined
}

/**
 * Gets the description for an enum value from object format.
 * Used when x-enumDescriptions is an object mapping enum values to descriptions.
 */
const getEnumValueDescriptionFromObject = (
  enumValue: any,
): string | undefined => {
  // Check if it's an object before using string index
  const enumDescriptions = value?.['x-enumDescriptions']

  if (enumDescriptions && !Array.isArray(enumDescriptions)) {
    return enumDescriptions[enumValue]
  }

  const xEnumDescriptions = value?.['x-enum-descriptions']

  if (xEnumDescriptions && !Array.isArray(xEnumDescriptions)) {
    return xEnumDescriptions[enumValue]
  }

  return undefined
}

// Computed properties
const enumValues = computed(() => extractEnumValues(value))

const hasEnumValues = computed(() => enumValues.value.length > 0)

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
    : ENUM_DISPLAY_THRESHOLD,
)

const visibleEnumValues = computed(() =>
  enumValues.value.slice(0, initialVisibleCount.value),
)

const hiddenEnumValues = computed(() =>
  enumValues.value.slice(initialVisibleCount.value),
)

/**
 * Determines if we should show enum descriptions as key-value pairs.
 * This only applies to object format of x-enumDescriptions.
 */
const shouldShowDescriptionsAsKeyValue = computed(() => {
  const descriptions =
    value?.['x-enumDescriptions'] ?? value?.['x-enum-descriptions']
  return (
    descriptions &&
    typeof descriptions === 'object' &&
    !Array.isArray(descriptions)
  )
})

/**
 * Determines if x-enumDescriptions is in object format (not array).
 */
const isObjectFormat = computed(() => {
  const descriptions =
    value?.['x-enumDescriptions'] ?? value?.['x-enum-descriptions']
  return (
    descriptions &&
    typeof descriptions === 'object' &&
    !Array.isArray(descriptions)
  )
})

/**
 * Determines if this component should render anything.
 * We do not show enum values for discriminator properties.
 */
const shouldRender = computed(() => hasEnumValues.value && !isDiscriminator)
</script>

<template>
  <div
    v-if="shouldRender"
    class="property-enum">
    <!-- Key-value description format -->
    <template v-if="isObjectFormat">
      <ul class="property-enum-values">
        <SchemaEnumPropertyItem
          v-for="(enumValue, index) in enumValues"
          :key="enumValue"
          :label="enumValue"
          :description="
            isObjectFormat
              ? getEnumValueDescriptionFromObject(enumValue)
              : getEnumValueDescription(index)
          " />
      </ul>
    </template>

    <!-- Standard enum list format -->
    <template v-else>
      <ul class="property-enum-values">
        <SchemaEnumPropertyItem
          v-for="(enumValue, index) in visibleEnumValues"
          :key="enumValue"
          :label="formatEnumValueWithName(enumValue, index)"
          :description="getEnumValueDescription(index)" />

        <Disclosure
          v-if="shouldUseLongListDisplay"
          v-slot="{ open }">
          <DisclosurePanel>
            <SchemaEnumPropertyItem
              v-for="(enumValue, index) in hiddenEnumValues"
              :key="enumValue"
              :label="
                formatEnumValueWithName(enumValue, initialVisibleCount + index)
              "
              :description="
                getEnumValueDescription(initialVisibleCount + index)
              " />
          </DisclosurePanel>

          <DisclosureButton class="enum-toggle-button">
            <ScalarIcon
              class="enum-toggle-button-icon"
              :class="{ 'enum-toggle-button-icon--open': open }"
              icon="Add"
              size="sm" />
            {{ open ? 'Hide values' : 'Show all values' }}
          </DisclosureButton>
        </Disclosure>
      </ul>
    </template>
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

.enum-toggle-button {
  align-items: center;
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-radius: 13.5px;
  cursor: pointer;
  color: var(--scalar-color-2);
  display: flex;
  font-weight: var(--scalar-semibold);
  font-size: var(--scalar-font-size-5);
  gap: 4px;
  margin-top: 8px;
  padding: 6px;
  user-select: none;
  white-space: nowrap;
}

.enum-toggle-button:hover {
  color: var(--scalar-color-1);
}

.enum-toggle-button-icon--open {
  transform: rotate(45deg);
}
</style>
