<script lang="ts" setup>
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ScalarIcon } from '@scalar/components'
import { computed } from 'vue'

import SchemaHeading from './SchemaHeading.vue'
import SchemaProperty from './SchemaProperty.vue'

const props = withDefaults(
  defineProps<{
    value?: Record<string, any> | string
    /** Track how deep we’ve gone */
    level?: number
    /* Show as a heading */
    name?: string
    /** A tighter layout with less borders and without a heading */
    compact?: boolean
    /** Shows a toggle to hide/show children */
    noncollapsible?: boolean
  }>(),
  { level: 0 },
)

const shouldShowToggle = computed(() => {
  if (props.noncollapsible || props.level === 0) return false
  return true
})

// Merge the (optional) `additionalProperties` into the schema
const mergedSchema = computed(() => {
  return {
    ...(typeof props.value === 'object' ? props.value : {}),
    ...(typeof props.value === 'object' &&
    typeof props.value?.additionalProperties === 'object'
      ? props.value?.additionalProperties
      : {}),
  }
})

// Prevent click action if noncollapsible
const handleClick = (e: MouseEvent) =>
  props.noncollapsible && e.stopPropagation()
</script>
<template>
  <Disclosure
    v-if="typeof value === 'object' && Object.keys(value).length"
    v-slot="{ open }"
    as="div"
    class="schema-card"
    :class="[
      `schema-card--level-${level}`,
      { 'schema-card--compact': compact },
    ]"
    :defaultOpen="noncollapsible">
    <div
      class="schema-properties"
      :class="{ 'schema-properties-open': open }">
      <DisclosureButton
        v-show="!(noncollapsible && compact)"
        :as="noncollapsible ? 'div' : 'button'"
        class="schema-card-title"
        :style="{
          top: `calc(var(--refs-header-height) +  calc(var(--schema-title-height) * ${level}))`,
        }"
        @click.capture="handleClick">
        <ScalarIcon
          v-if="shouldShowToggle"
          class="schema-card-title-icon"
          :icon="open ? 'ChevronDown' : 'ChevronRight'"
          size="md" />
        <SchemaHeading
          :name="name"
          :value="mergedSchema" />
      </DisclosureButton>
      <DisclosurePanel :static="noncollapsible">
        <template v-if="mergedSchema?.properties">
          <SchemaProperty
            v-for="property in Object.keys(mergedSchema?.properties)"
            :key="property"
            :compact="compact"
            :level="level"
            :name="property"
            :required="
              mergedSchema.required &&
              mergedSchema.required.length &&
              mergedSchema.required.includes(property)
            "
            :value="mergedSchema.properties?.[property]" />
        </template>
        <template v-else>
          <SchemaProperty
            :compact="compact"
            :level="level"
            :name="mergedSchema?.name"
            :value="mergedSchema" />
        </template>
      </DisclosurePanel>
    </div>
  </Disclosure>
</template>
<style scoped>
.error {
  background-color: red;
}
.schema-card {
  z-index: 0;
  position: relative;
  width: 100%;
  font-size: var(--theme-font-size-3, var(--default-theme-font-size-3));
  color: var(--theme-color-1, var(--default-theme-color-1));
}

.schema-card-title {
  --schema-title-height: 38px;
  height: var(--schema-title-height);

  padding: 10px 12px;

  display: flex;
  align-items: center;
  gap: 4px;

  color: var(--theme-color-2, var(--default-theme-color-2));
  font-weight: var(--theme-bold, var(--default-theme-bold));
  font-size: var(--theme-micro, var(--default-theme-micro));
  background: var(--theme-background-1, var(--default-theme-background-1));
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
  border-bottom: 1px solid transparent;
}
button.schema-card-title {
  cursor: pointer;
}
button.schema-card-title:hover {
  color: var(--theme-color-1, var(--default-theme-color-1));
}
.schema-card-title-icon {
  margin-left: -4px;
}

.schema-properties-open > .schema-card-title {
  z-index: 1;
  position: sticky;
  top: var(--refs-header-height);

  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-color: var(--theme-border-color, var(--default-theme-border-color));
}

.schema-card .property:last-of-type {
  padding-bottom: 10px;
}

.schema-properties {
  display: flex;
  flex-direction: column;

  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
}

.schema-card--compact.schema-card--level-0 > .schema-properties {
  border: none;
}
</style>
