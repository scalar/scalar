<script lang="ts" setup>
import { computed, ref } from 'vue'

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
    toggleVisibility?: boolean
    /** Even if toggleVisibility is true, the content will always be shown. But children still have the toggle. */
    hideVisibilityToggle?: boolean
  }>(),
  {
    level: 0,
    compact: false,
    toggleVisibility: false,
    hideVisibilityToggle: false,
  },
)

const shouldShowToggle = computed(() => {
  if (props.hideVisibilityToggle) {
    return false
  }

  if (!props.toggleVisibility) {
    return false
  }

  if (props.level === 0) {
    return false
  }

  return true
})

const visible = ref<boolean>(false)

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
</script>
<template>
  <template v-if="typeof value === 'object' && Object.keys(value).length">
    <div
      class="schema-card"
      :class="`${
        compact ? 'schema-card--compact' : ''
      } schema-card--level-${level}`">
      <div
        v-if="mergedSchema.properties || mergedSchema.items"
        class="properties"
        :class="`properties--${
          !shouldShowToggle || visible ? 'visible' : 'hidden'
        }`">
        <template v-if="shouldShowToggle">
          <button
            class="schema-visibility-toggle"
            :class="`schema-visibility-toggle--${
              visible ? 'visible' : 'hidden'
            }`"
            type="button"
            @click="visible = !visible">
            <svg
              fill="currentColor"
              height="14"
              viewBox="0 0 14 14"
              width="14"
              xmlns="http://www.w3.org/2000/svg">
              <polygon
                fill-rule="nonzero"
                points="14 8 8 8 8 14 6 14 6 8 0 8 0 6 6 6 6 0 8 0 8 6 14 6" />
            </svg>
            <span>
              <template v-if="visible">Hide Child Attributes</template>
              <template v-else>Show Child Attributes</template>
            </span>
          </button>
        </template>
        <template v-if="!shouldShowToggle || visible">
          <template v-if="mergedSchema?.properties">
            <div
              v-if="!compact"
              class="schema-card-title">
              <SchemaHeading
                :name="name"
                :value="mergedSchema" />
            </div>
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
              :toggleVisibility="toggleVisibility"
              :value="mergedSchema.properties?.[property]" />
          </template>
          <template v-else>
            <SchemaProperty
              :compact="compact"
              :level="level"
              :name="mergedSchema?.name"
              :toggleVisibility="toggleVisibility"
              :value="mergedSchema" />
          </template>
        </template>
      </div>
    </div>
  </template>
</template>
<style scoped>
.error {
  background-color: red;
}
.schema-card {
  width: 100%;
  margin-top: 24px;
  font-size: var(--theme-font-size-3, var(--default-theme-font-size-3));
  color: var(--theme-color-1, var(--default-theme-color-1));
}
.schema-card-title {
  color: var(--theme-color-2, var(--default-theme-color-2));
  font-weight: var(--theme-bold, var(--default-theme-bold));
  font-size: var(--theme-micro, var(--default-theme-micro));
  background: var(--theme-background-4, var(--default-theme-background-4));
  padding: 10px 12px;
}
.schema-card .property:last-of-type {
  padding-bottom: 10px;
}
/* Style the "icon" */
.schema-card-title :deep(em) {
  color: var(--theme-color-1, var(--default-theme-color-1));
}

.properties {
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
  overflow: hidden;
}

.properties .properties {
  margin-top: 12px;
}
.schema-card--compact {
  margin: 0;
}
.schema-card--compact .schema-card--compact > .properties {
  margin: 9px 0 0;
}

.schema-card--compact.schema-card--level-0 > .properties {
  border: none;
}

.schema-visibility-toggle {
  padding: 6px 12px;
  cursor: pointer;
  color: var(--theme-color-3, var(--default-theme-color-3));
  font-size: var(--theme-micro, var(--default-theme-micro));
  display: flex;
  align-items: center;
  user-select: none;
  font-family: var(--theme-font, var(--default-theme-font));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
}

.schema-visibility-toggle + .property {
  border-top: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}

.schema-visibility-toggle:hover {
  color: var(--theme-color-1, var(--default-theme-color-1));
}

.schema-visibility-toggle svg {
  height: 10px;
  width: 10px;
  margin-right: 6px;
}
.schema-visibility-toggle--visible svg {
  transform: rotate(45deg);
}

.properties--hidden {
  border-radius: 100px;
  display: flex;
  width: fit-content;
}
</style>
