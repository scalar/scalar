<script lang="ts" setup>
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ScalarIcon, ScalarMarkdown } from '@scalar/components'
import { computed } from 'vue'

const { value, isDiscriminator } = defineProps<{
  value?: Record<string, any>
  isDiscriminator?: boolean
}>()

const getEnumFromValue = (value?: Record<string, any>): any[] | [] =>
  value?.enum || value?.items?.enum || []

// These helpers manage how enum values are displayed:
//
// - For enums with 9 or fewer values, all values are shown.
// - For enums with more than 9 values, only first 5 are shown initially.
// - A “Show more” button reveals the remaining values.
const hasLongEnumList = computed(() => getEnumFromValue(value).length > 9)

const initialEnumCount = computed(() => (hasLongEnumList.value ? 5 : 9))

const visibleEnumValues = computed(() =>
  getEnumFromValue(value).slice(0, initialEnumCount.value),
)
const remainingEnumValues = computed(() =>
  getEnumFromValue(value).slice(initialEnumCount.value),
)

const shouldShowEnumDescriptions = computed(() => {
  if (!value?.['x-enumDescriptions']) {
    return false
  }

  const enumDescriptions = value['x-enumDescriptions']

  return (
    typeof enumDescriptions === 'object' && !Array.isArray(enumDescriptions)
  )
})
</script>
<template>
  <div
    v-if="getEnumFromValue(value)?.length > 0 && !isDiscriminator"
    class="property-enum">
    <template v-if="shouldShowEnumDescriptions">
      <div class="property-list">
        <div
          v-for="enumValue in getEnumFromValue(value)"
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
    <template v-else>
      <ul class="property-enum-values">
        <li
          v-for="(enumValue, index) in visibleEnumValues"
          :key="enumValue"
          class="property-enum-value">
          <span class="property-enum-value-label">
            <!-- TODO: Equal sign only if both sides are filled -->
            <!-- TODO: Description tooltip -->
            {{ enumValue }}&ThinSpace;=&ThinSpace;{{
              value?.['x-enum-varnames']?.[index]
            }}
            <span class="property-enum-value-description">
              <ScalarMarkdown :value="value?.['x-enumDescriptions']?.[index]" />
            </span>
          </span>
        </li>
        <Disclosure
          v-if="hasLongEnumList"
          v-slot="{ open }">
          <DisclosurePanel>
            <li
              v-for="enumValue in remainingEnumValues"
              :key="enumValue"
              class="property-enum-value">
              <span class="property-enum-value-label">
                {{ enumValue }}
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
.property-enum-value-label {
  display: flex;
  padding: 3px 0;
  font-family: var(--scalar-font-code);
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
  color: var(--scalar-color-2);
  margin-left: 6px;
}
</style>
