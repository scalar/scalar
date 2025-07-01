<script lang="ts" setup>
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ScalarIcon, ScalarMarkdown } from '@scalar/components'
import { computed } from 'vue'

const ENUM_DISPLAY_THRESHOLD = 9
const INITIAL_VISIBLE_COUNT = 5
const THIN_SPACE = ' '

type SchemaValue = {
  'enum'?: any[]
  'items'?: { enum?: any[] }
  'x-enumDescriptions'?: Record<string, string>
  'x-enum-descriptions'?: string[]
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
  return (
    value?.['x-enum-descriptions']?.[index] ??
    value?.['x-enumDescriptions']?.[index]
  )
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
 * This is used when x-enumDescriptions is an object mapping enum values to descriptions.
 */
const shouldShowDescriptionsAsKeyValue = computed(() => {
  const descriptions = value?.['x-enumDescriptions']
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
    <template v-if="shouldShowDescriptionsAsKeyValue">
      <div class="property-list">
        <div
          v-for="enumValue in enumValues"
          :key="enumValue"
          class="property">
          <div class="property-heading">
            <div class="property-name">{{ enumValue }}</div>
          </div>
          <div class="property-description">
            <ScalarMarkdown
              :value="value?.['x-enumDescriptions']?.[enumValue]" />
          </div>
        </div>
      </div>
    </template>

    <!-- Standard enum list format -->
    <template v-else>
      <ul class="property-enum-values">
        <!-- Initially visible enum values -->
        <li
          v-for="(enumValue, index) in visibleEnumValues"
          :key="enumValue"
          class="property-enum-value">
          <div class="property-enum-value-content">
            <span class="property-enum-value-label">
              {{ formatEnumValueWithName(enumValue, index) }}
            </span>
            <span class="property-enum-value-description">
              <ScalarMarkdown :value="getEnumValueDescription(index)" />
            </span>
          </div>
        </li>

        <!-- Expandable section for remaining values -->
        <Disclosure
          v-if="shouldUseLongListDisplay"
          v-slot="{ open }">
          <DisclosurePanel>
            <li
              v-for="(enumValue, index) in hiddenEnumValues"
              :key="enumValue"
              class="property-enum-value">
              <span class="property-enum-value-label">
                {{
                  formatEnumValueWithName(
                    enumValue,
                    initialVisibleCount + index,
                  )
                }}
              </span>
            </li>
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

.property-enum-value {
  color: var(--scalar-color-3);
  line-height: 1.5;
  word-break: break-word;
  display: flex;
  align-items: stretch;
  position: relative;
}

.property-enum-value-content {
  display: flex;
  flex-direction: column;
  padding: 3px 0;
}

.property-enum-value-label {
  display: flex;
  font-family: var(--scalar-font-code);
  color: var(--scalar-color-2);
}
.property-enum-value:last-of-type .property-enum-value-label {
  padding-bottom: 0;
}
.property-enum-value::before {
  content: '';
  margin-right: 12px;
  width: var(--scalar-border-width);
  display: block;
  background: currentColor;
  color: var(--scalar-color-3);
}
.property-enum-value:after {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  width: 8px;
  height: var(--scalar-border-width);
  background: currentColor;
}
.property-enum-value:last-of-type::after {
  bottom: 0;
  height: 50%;
  background: var(--scalar-background-1);
  border-top: var(--scalar-border-width) solid currentColor;
}
.property-enum-values {
  margin-top: 8px;
  list-style: none;
}

.property-enum-value-description {
  color: var(--scalar-color-3);
}
</style>
