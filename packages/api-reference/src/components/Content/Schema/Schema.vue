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
    :defaultOpen="noncollapsible">
    <div
      class="schema-card"
      :class="[
        `schema-card--level-${level}`,
        { 'schema-card--compact': compact, 'schema-card--open': open },
      ]">
      <div
        v-if="value?.description"
        class="schema-card-description">
        {{ value.description }}
      </div>
      <div
        class="schema-properties"
        :class="{ 'schema-properties-open': open }">
        <DisclosureButton
          v-show="!(noncollapsible && compact)"
          :as="noncollapsible ? 'div' : 'button'"
          class="schema-card-title"
          :class="{ 'schema-card-title--compact': compact }"
          :style="{
            top: `calc(var(--refs-header-height) +  calc(var(--schema-title-height) * ${level}))`,
          }"
          @click.capture="handleClick">
          <template v-if="compact">
            <svg
              v-if="shouldShowToggle"
              class="schema-card-title-icon"
              :class="{ 'schema-card-title-icon--open': open }"
              fill="currentColor"
              height="14"
              viewBox="0 0 14 14"
              width="14"
              xmlns="http://www.w3.org/2000/svg">
              <polygon
                fill-rule="nonzero"
                points="14 8 8 8 8 14 6 14 6 8 0 8 0 6 6 6 6 0 8 0 8 6 14 6" />
            </svg>
            <template v-if="open">Hide Child Attributes</template>
            <template v-else>Show Child Attributes</template>
          </template>
          <template v-else>
            <ScalarIcon
              v-if="shouldShowToggle"
              class="schema-card-title-icon"
              :class="{ 'schema-card-title-icon--open': open }"
              icon="ChevronRight"
              size="md" />
            <SchemaHeading
              :name="name"
              :value="mergedSchema" />
          </template>
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
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
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
.schema-card-title-icon--open {
  transform: rotate(90deg);
}
.schema-properties-open > .schema-card-title {
  z-index: 1;
  position: sticky;
  top: var(--refs-header-height);

  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-bottom: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}

.schema-card .property:last-of-type {
  padding-bottom: 10px;
}

.schema-card-description {
  margin: 10px 0;
  font-size: var(--theme-small, var(--default-theme-small));
  font-weight: var(
    --font-weight,
    var(--default-font-weight, var(--theme-bold, var(--default-theme-bold)))
  );
}

.schema-properties {
  display: flex;
  flex-direction: column;

  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
}

.schema-card--compact {
  align-self: start;
}

.schema-card--compact.schema-card--open {
  align-self: initial;
}

.schema-card-title--compact {
  color: var(--theme-color-3, var(--default-theme-color-3));
  padding: 6px 10px;
  height: auto;
  border-bottom: none;
}
.schema-card--compact > .schema-properties,
.schema-card-title--compact {
  border-radius: 13.5px;
}

.schema-card-title--compact > .schema-card-title-icon {
  width: 10px;
  height: 10px;
  margin: 0;
}
.schema-card-title--compact > .schema-card-title-icon--open {
  transform: rotate(45deg);
}
.schema-properties-open > .schema-card-title--compact {
  position: static;
}
.schema-card--compact.schema-card--level-0 > .schema-properties {
  border: none;
}
</style>
